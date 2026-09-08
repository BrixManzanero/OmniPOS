from datetime import date, timedelta
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from .. import models
from ..core.database import get_db


AnalyticsPeriod = Literal["today", "7d", "30d", "custom"]

router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"],
)


def calculate_aov(revenue: float, orders: int) -> float:
    if orders == 0:
        return 0.0

    return round(revenue / orders, 2)


def calculate_change_percent(
    current: float,
    previous: float,
) -> float | None:
    if previous == 0:
        return 0.0 if current == 0 else None

    return round(
        ((current - previous) / previous) * 100,
        2,
    )


def resolve_date_range(
    period: AnalyticsPeriod,
    start_date: date | None,
    end_date: date | None,
) -> tuple[date, date]:
    today = date.today()

    if period == "today":
        return today, today

    if period == "7d":
        return today - timedelta(days=6), today

    if period == "30d":
        return today - timedelta(days=29), today

    if start_date is None or end_date is None:
        raise HTTPException(
            status_code=400,
            detail=(
                "start_date and end_date are required "
                "for custom period."
            ),
        )

    if start_date > end_date:
        raise HTTPException(
            status_code=400,
            detail=(
                "start_date cannot be later than end_date."
            ),
        )

    total_days = (end_date - start_date).days + 1

    if total_days > 366:
        raise HTTPException(
            status_code=400,
            detail=(
                "Custom analytics range cannot exceed 366 days."
            ),
        )

    return start_date, end_date


def get_orders_for_period(
    db: Session,
    range_start: date,
    range_end: date,
):
    return (
        db.query(models.Order)
        .filter(
            func.date(models.Order.created_at) >= range_start,
            func.date(models.Order.created_at) <= range_end,
            models.Order.status == "completed",
        )
        .all()
    )


def get_period_metrics(
    db: Session,
    range_start: date,
    range_end: date,
):
    order_result = (
        db.query(
            func.count(models.Order.id).label("orders"),
            func.coalesce(
                func.sum(models.Order.total_amount),
                0,
            ).label("revenue"),
        )
        .filter(
            func.date(models.Order.created_at) >= range_start,
            func.date(models.Order.created_at) <= range_end,
            models.Order.status == "completed",
        )
        .one()
    )

    total_orders = int(order_result.orders or 0)
    total_revenue = float(order_result.revenue or 0)

    units_sold_result = (
        db.query(
            func.coalesce(
                func.sum(models.OrderItem.quantity),
                0,
            )
        )
        .join(
            models.Order,
            models.Order.id == models.OrderItem.order_id,
        )
        .filter(
            func.date(models.Order.created_at) >= range_start,
            func.date(models.Order.created_at) <= range_end,
            models.Order.status == "completed",
        )
        .scalar()
    )

    return {
        "total_orders": total_orders,
        "total_revenue": round(total_revenue, 2),
        "average_order_value": calculate_aov(
            total_revenue,
            total_orders,
        ),
        "units_sold": int(units_sold_result or 0),
    }


def build_channel_breakdown(orders):
    pos_orders = [
        order
        for order in orders
        if order.order_channel == "POS"
    ]

    online_orders = [
        order
        for order in orders
        if order.order_channel == "ONLINE"
    ]

    def summarize(items):
        revenue = sum(
            float(order.total_amount)
            for order in items
        )

        return {
            "orders": len(items),
            "revenue": round(revenue, 2),
            "aov": calculate_aov(
                revenue,
                len(items),
            ),
        }

    return {
        "pos": summarize(pos_orders),
        "online": summarize(online_orders),
    }


def build_segment_breakdown(orders):
    def summarize(items):
        return {
            "orders": len(items),
            "revenue": round(
                sum(
                    float(order.total_amount)
                    for order in items
                ),
                2,
            ),
        }

    return {
        "pos_walkin": summarize([
            order
            for order in orders
            if (
                order.order_channel == "POS"
                and order.customer_id is None
            )
        ]),
        "pos_registered": summarize([
            order
            for order in orders
            if (
                order.order_channel == "POS"
                and order.customer_id is not None
            )
        ]),
        "online_guest": summarize([
            order
            for order in orders
            if (
                order.order_channel == "ONLINE"
                and order.customer_id is None
            )
        ]),
        "online_registered": summarize([
            order
            for order in orders
            if (
                order.order_channel == "ONLINE"
                and order.customer_id is not None
            )
        ]),
    }


def get_registration_breakdown(orders):
    unregistered = [
        order
        for order in orders
        if order.customer_id is None
    ]

    registered = [
        order
        for order in orders
        if order.customer_id is not None
    ]

    registered_customer_ids = {
        order.customer_id
        for order in registered
        if order.customer_id is not None
    }

    return {
        "unregistered_orders": len(unregistered),
        "unregistered_revenue": round(
            sum(
                float(order.total_amount)
                for order in unregistered
            ),
            2,
        ),
        "registered_orders": len(registered),
        "registered_revenue": round(
            sum(
                float(order.total_amount)
                for order in registered
            ),
            2,
        ),
        "unique_registered_customers": len(
            registered_customer_ids
        ),
    }


def get_daily_sales_for_period(
    db: Session,
    range_start: date,
    range_end: date,
):
    total_days = (range_end - range_start).days + 1

    rows = (
        db.query(
            func.date(
                models.Order.created_at
            ).label("sale_date"),
            func.sum(
                models.Order.total_amount
            ).label("sales"),
            func.count(
                models.Order.id
            ).label("orders"),
        )
        .filter(
            func.date(models.Order.created_at) >= range_start,
            func.date(models.Order.created_at) <= range_end,
            models.Order.status == "completed",
        )
        .group_by(
            func.date(models.Order.created_at)
        )
        .order_by(
            func.date(models.Order.created_at)
        )
        .all()
    )

    sales_map = {
        str(row.sale_date): {
            "sales": float(row.sales or 0),
            "orders": int(row.orders or 0),
        }
        for row in rows
    }

    result = []

    for index in range(total_days):
        current_date = range_start + timedelta(days=index)

        key = current_date.isoformat()

        values = sales_map.get(
            key,
            {
                "sales": 0,
                "orders": 0,
            },
        )

        result.append({
            "date": key,
            "label": current_date.strftime("%b %d"),
            "sales": round(
                values["sales"],
                2,
            ),
            "orders": values["orders"],
        })

    return result


def get_product_performance_for_period(
    db: Session,
    range_start: date,
    range_end: date,
    product_names: list[str] | None = None,
    limit: int | None = None,
):
    quantity_sum = func.sum(
        models.OrderItem.quantity
    )

    query = (
        db.query(
            models.OrderItem.product_name,
            quantity_sum.label("quantity"),
            func.sum(
                models.OrderItem.line_total
            ).label("revenue"),
        )
        .join(
            models.Order,
            models.Order.id
            == models.OrderItem.order_id,
        )
        .filter(
            func.date(models.Order.created_at) >= range_start,
            func.date(models.Order.created_at) <= range_end,
            models.Order.status == "completed",
        )
    )

    if product_names is not None:
        if not product_names:
            return []

        query = query.filter(
            models.OrderItem.product_name.in_(
                product_names
            )
        )

    query = query.group_by(
        models.OrderItem.product_name
    )

    if product_names is None:
        query = query.order_by(
            quantity_sum.desc()
        )

    if limit is not None:
        query = query.limit(limit)

    rows = query.all()

    products = [
        {
            "name": row.product_name,
            "quantity": int(
                row.quantity or 0
            ),
            "revenue": round(
                float(
                    row.revenue or 0
                ),
                2,
            ),
        }
        for row in rows
    ]

    if product_names is None:
        return products

    product_map = {
        product["name"]: product
        for product in products
    }

    return [
        product_map.get(
            name,
            {
                "name": name,
                "quantity": 0,
                "revenue": 0.0,
            },
        )
        for name in product_names
    ]


@router.get("/dashboard")
def dashboard_analytics(
    db: Session = Depends(get_db),
):
    today = date.today()
    start_date = today - timedelta(days=6)

    last_7_days = get_daily_sales_for_period(
        db,
        start_date,
        today,
    )

    top_products = (
        get_product_performance_for_period(
            db,
            start_date,
            today,
            limit=5,
        )
    )

    daily_sales = [
        day["sales"]
        for day in last_7_days
    ]

    days_with_sales = sum(
        1
        for value in daily_sales
        if value > 0
    )

    average_daily_sales = (
        sum(daily_sales) / 7
    )

    forecast = [
        {
            "date": (
                today
                + timedelta(days=index)
            ).isoformat(),
            "label": (
                today
                + timedelta(days=index)
            ).strftime("%b %d"),
            "forecast_sales": round(
                average_daily_sales,
                2,
            ),
        }
        for index in range(1, 8)
    ]

    return {
        "sales_last_7_days":
            last_7_days,
        "top_products":
            top_products,
        "forecast":
            forecast,
        "forecast_ready":
            days_with_sales >= 3,
        "forecast_note": (
            "Baseline estimate using "
            "7-day average daily sales."
        ),
    }


@router.get("/overview")
def analytics_overview(
    period: AnalyticsPeriod = "7d",
    start_date: date | None = None,
    end_date: date | None = None,
    db: Session = Depends(get_db),
):
    range_start, range_end = (
        resolve_date_range(
            period,
            start_date,
            end_date,
        )
    )

    total_days = (
        range_end - range_start
    ).days + 1

    orders = get_orders_for_period(
        db,
        range_start,
        range_end,
    )

    current_metrics = (
        get_period_metrics(
            db,
            range_start,
            range_end,
        )
    )

    channels = build_channel_breakdown(
        orders
    )

    segments = build_segment_breakdown(
        orders
    )

    registration = (
        get_registration_breakdown(
            orders
        )
    )

    daily_sales = (
        get_daily_sales_for_period(
            db,
            range_start,
            range_end,
        )
    )

    top_products = (
        get_product_performance_for_period(
            db,
            range_start,
            range_end,
            limit=10,
        )
    )

    previous_end = (
        range_start
        - timedelta(days=1)
    )

    previous_start = (
        previous_end
        - timedelta(
            days=total_days - 1
        )
    )

    previous_metrics = (
        get_period_metrics(
            db,
            previous_start,
            previous_end,
        )
    )

    previous_orders = (
        get_orders_for_period(
            db,
            previous_start,
            previous_end,
        )
    )

    previous_channels = (
        build_channel_breakdown(
            previous_orders
        )
    )

    previous_segments = (
        build_segment_breakdown(
            previous_orders
        )
    )

    previous_daily_sales = (
        get_daily_sales_for_period(
            db,
            previous_start,
            previous_end,
        )
    )

    current_top_product_names = [
        product["name"]
        for product in top_products
    ]

    previous_top_products = (
        get_product_performance_for_period(
            db,
            previous_start,
            previous_end,
            product_names=(
                current_top_product_names
            ),
        )
    )

    revenue_change_percent = (
        calculate_change_percent(
            current_metrics[
                "total_revenue"
            ],
            previous_metrics[
                "total_revenue"
            ],
        )
    )

    orders_change_percent = (
        calculate_change_percent(
            float(
                current_metrics[
                    "total_orders"
                ]
            ),
            float(
                previous_metrics[
                    "total_orders"
                ]
            ),
        )
    )

    aov_change_percent = (
        calculate_change_percent(
            current_metrics[
                "average_order_value"
            ],
            previous_metrics[
                "average_order_value"
            ],
        )
    )

    units_change_percent = (
        calculate_change_percent(
            float(
                current_metrics[
                    "units_sold"
                ]
            ),
            float(
                previous_metrics[
                    "units_sold"
                ]
            ),
        )
    )

    return {
        "period":
            period,

        "start_date":
            range_start.isoformat(),

        "end_date":
            range_end.isoformat(),

        "days":
            total_days,

        "total_revenue":
            current_metrics[
                "total_revenue"
            ],

        "total_orders":
            current_metrics[
                "total_orders"
            ],

        "average_order_value":
            current_metrics[
                "average_order_value"
            ],

        "units_sold":
            current_metrics[
                "units_sold"
            ],

        "pos_revenue":
            channels[
                "pos"
            ]["revenue"],

        "pos_orders":
            channels[
                "pos"
            ]["orders"],

        "pos_aov":
            channels[
                "pos"
            ]["aov"],

        "online_revenue":
            channels[
                "online"
            ]["revenue"],

        "online_orders":
            channels[
                "online"
            ]["orders"],

        "online_aov":
            channels[
                "online"
            ]["aov"],

        # Temporary names kept for
        # frontend compatibility.
        #
        # These represent:
        # POS walk-in + ONLINE guest.
        "guest_walkin_orders":
            registration[
                "unregistered_orders"
            ],

        "guest_walkin_revenue":
            registration[
                "unregistered_revenue"
            ],

        "registered_orders":
            registration[
                "registered_orders"
            ],

        "registered_revenue":
            registration[
                "registered_revenue"
            ],

        "unique_registered_customers":
            registration[
                "unique_registered_customers"
            ],

        "segments":
            segments,

        "daily_sales":
            daily_sales,

        "top_products":
            top_products,

        "previous_daily_sales":
            previous_daily_sales,

        "previous_top_products":
            previous_top_products,

        "previous_segments":
            previous_segments,

        "previous_channels":
            previous_channels,

        "comparison": {
            "previous_start_date":
                previous_start.isoformat(),

            "previous_end_date":
                previous_end.isoformat(),

            "previous_total_revenue":
                previous_metrics[
                    "total_revenue"
                ],

            "previous_total_orders":
                previous_metrics[
                    "total_orders"
                ],

            "previous_average_order_value":
                previous_metrics[
                    "average_order_value"
                ],

            "previous_units_sold":
                previous_metrics[
                    "units_sold"
                ],

            "revenue_change_percent":
                revenue_change_percent,

            "orders_change_percent":
                orders_change_percent,

            "aov_change_percent":
                aov_change_percent,

            "units_change_percent":
                units_change_percent,
        },
    }