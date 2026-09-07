from datetime import date, timedelta

from typing import Literal

from fastapi import (

    APIRouter,

    Depends,

    HTTPException,

)

from sqlalchemy import func

from sqlalchemy.orm import Session

from ..core.database import get_db

from .. import models



router = APIRouter(

    prefix="/analytics",

    tags=["Analytics"],

)



# ==========================================================

# HELPERS

# ==========================================================

def calculate_aov(

    revenue: float,

    orders: int,

) -> float:

    if orders == 0:

        return 0.0

    return round(

        revenue / orders,

        2,

    )



def calculate_change_percent(

    current: float,

    previous: float,

) -> float | None:

    """

    Percentage change between two periods.

    Returns:

    - 0.0 if both periods are zero

    - None if previous is zero but current is greater than zero

      because percentage growth is mathematically undefined

    - otherwise normal percentage change

    """

    if previous == 0:

        if current == 0:

            return 0.0

        return None

    return round(

        (

            (current - previous)

            / previous

        )

        * 100,

        2,

    )



def resolve_date_range(

    period: Literal[

        "today",

        "7d",

        "30d",

        "custom",

    ],

    start_date: date | None,

    end_date: date | None,

):

    today = date.today()

    # TODAY

    if period == "today":

        return today, today

    # LAST 7 DAYS

    if period == "7d":

        return (

            today - timedelta(days=6),

            today,

        )

    # LAST 30 DAYS

    if period == "30d":

        return (

            today - timedelta(days=29),

            today,

        )

    # CUSTOM

    if (

        start_date is None

        or end_date is None

    ):

        raise HTTPException(

            status_code=400,

            detail=(

                "start_date and end_date "

                "are required for custom period."

            ),

        )

    if start_date > end_date:

        raise HTTPException(

            status_code=400,

            detail=(

                "start_date cannot be "

                "later than end_date."

            ),

        )

    total_days = (

        end_date - start_date

    ).days + 1

    if total_days > 366:

        raise HTTPException(

            status_code=400,

            detail=(

                "Custom analytics range "

                "cannot exceed 366 days."

            ),

        )

    return start_date, end_date



def get_period_metrics(

    db: Session,

    range_start: date,

    range_end: date,

):

    """

    Get summary metrics for any date range.

    Used for previous-period comparison.

    """

    order_result = (

        db.query(

            func.count(

                models.Order.id

            ).label("orders"),

            func.coalesce(

                func.sum(

                    models.Order.total_amount

                ),

                0,

            ).label("revenue"),

        )

        .filter(

            func.date(

                models.Order.created_at

            ) >= range_start,

            func.date(

                models.Order.created_at

            ) <= range_end,

            models.Order.status

            == "completed",

        )

        .one()

    )

    total_orders = int(

        order_result.orders or 0

    )

    total_revenue = float(

        order_result.revenue or 0

    )

    units_sold_result = (

        db.query(

            func.coalesce(

                func.sum(

                    models.OrderItem.quantity

                ),

                0,

            )

        )

        .join(

            models.Order,

            models.Order.id

            == models.OrderItem.order_id,

        )

        .filter(

            func.date(

                models.Order.created_at

            ) >= range_start,

            func.date(

                models.Order.created_at

            ) <= range_end,

            models.Order.status

            == "completed",

        )

        .scalar()

    )

    units_sold = int(

        units_sold_result or 0

    )

    average_order_value = (

        calculate_aov(

            total_revenue,

            total_orders,

        )

    )

    return {

        "total_orders":

            total_orders,

        "total_revenue":

            round(

                total_revenue,

                2,

            ),

        "average_order_value":

            average_order_value,

        "units_sold":

            units_sold,

    }



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


def build_channel_breakdown(orders):
    pos_orders_list = [
        order for order in orders
        if order.order_channel == "POS"
    ]

    online_orders_list = [
        order for order in orders
        if order.order_channel == "ONLINE"
    ]

    pos_orders = len(pos_orders_list)
    online_orders = len(online_orders_list)

    pos_revenue = sum(
        float(order.total_amount)
        for order in pos_orders_list
    )

    online_revenue = sum(
        float(order.total_amount)
        for order in online_orders_list
    )

    return {
        "pos": {
            "orders": pos_orders,
            "revenue": round(pos_revenue, 2),
            "aov": calculate_aov(
                pos_revenue,
                pos_orders,
            ),
        },
        "online": {
            "orders": online_orders,
            "revenue": round(online_revenue, 2),
            "aov": calculate_aov(
                online_revenue,
                online_orders,
            ),
        },
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
            order for order in orders
            if order.order_channel == "POS"
            and order.customer_id is None
        ]),
        "pos_registered": summarize([
            order for order in orders
            if order.order_channel == "POS"
            and order.customer_id is not None
        ]),
        "online_guest": summarize([
            order for order in orders
            if order.order_channel == "ONLINE"
            and order.customer_id is None
        ]),
        "online_registered": summarize([
            order for order in orders
            if order.order_channel == "ONLINE"
            and order.customer_id is not None
        ]),
    }


def get_daily_sales_for_period(
    db: Session,
    range_start: date,
    range_end: date,
):
    total_days = (
        range_end - range_start
    ).days + 1

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
            func.date(
                models.Order.created_at
            ) >= range_start,
            func.date(
                models.Order.created_at
            ) <= range_end,
            models.Order.status
            == "completed",
        )
        .group_by(
            func.date(
                models.Order.created_at
            )
        )
        .order_by(
            func.date(
                models.Order.created_at
            )
        )
        .all()
    )

    sales_map = {
        str(row.sale_date): {
            "sales":
                float(
                    row.sales or 0
                ),
            "orders":
                int(
                    row.orders or 0
                ),
        }
        for row in rows
    }

    result = []

    for index in range(
        total_days
    ):
        current_date = (
            range_start
            + timedelta(days=index)
        )

        key = current_date.isoformat()

        values = sales_map.get(
            key,
            {
                "sales": 0,
                "orders": 0,
            },
        )

        result.append({
            "date":
                key,
            "label":
                current_date.strftime(
                    "%b %d"
                ),
            "sales":
                round(
                    values["sales"],
                    2,
                ),
            "orders":
                values["orders"],
        })

    return result


def get_product_performance_for_period(
    db: Session,
    range_start: date,
    range_end: date,
    product_names: list[str] | None = None,
):
    query = (
        db.query(
            models.OrderItem.product_name,
            func.sum(
                models.OrderItem.quantity
            ).label("quantity"),
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
            func.date(
                models.Order.created_at
            ) >= range_start,
            func.date(
                models.Order.created_at
            ) <= range_end,
            models.Order.status
            == "completed",
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

    rows = (
        query
        .group_by(
            models.OrderItem.product_name
        )
        .all()
    )

    products = [
        {
            "name":
                row.product_name,
            "quantity":
                int(
                    row.quantity or 0
                ),
            "revenue":
                round(
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
        product["name"]:
            product
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


# ==========================================================

# EXISTING DASHBOARD ANALYTICS

# ==========================================================

@router.get("/dashboard")

def dashboard_analytics(

    db: Session = Depends(get_db),

):

    today = date.today()

    start_date = (

        today - timedelta(days=6)

    )

    # ======================================================

    # LAST 7 DAYS SALES

    # ======================================================

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

            func.date(

                models.Order.created_at

            ) >= start_date,

            func.date(

                models.Order.created_at

            ) <= today,

            models.Order.status

            == "completed",

        )

        .group_by(

            func.date(

                models.Order.created_at

            )

        )

        .all()

    )

    sales_map = {

        str(row.sale_date): {

            "sales":

                float(

                    row.sales or 0

                ),

            "orders":

                int(

                    row.orders or 0

                ),

        }

        for row in rows

    }

    last_7_days = []

    for index in range(7):

        current_date = (

            start_date

            + timedelta(days=index)

        )

        key = (

            current_date.isoformat()

        )

        data = sales_map.get(

            key,

            {

                "sales": 0,

                "orders": 0,

            },

        )

        last_7_days.append({

            "date":

                key,

            "label":

                current_date.strftime(

                    "%b %d"

                ),

            "sales":

                round(

                    data["sales"],

                    2,

                ),

            "orders":

                data["orders"],

        })

    # ======================================================

    # TOP PRODUCTS

    # ======================================================

    top_product_rows = (

        db.query(

            models.OrderItem.product_name,

            func.sum(

                models.OrderItem.quantity

            ).label("quantity"),

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

            func.date(

                models.Order.created_at

            ) >= start_date,

            func.date(

                models.Order.created_at

            ) <= today,

            models.Order.status

            == "completed",

        )

        .group_by(

            models.OrderItem.product_name

        )

        .order_by(

            func.sum(

                models.OrderItem.quantity

            ).desc()

        )

        .limit(5)

        .all()

    )

    top_products = [

        {

            "name":

                row.product_name,

            "quantity":

                int(

                    row.quantity or 0

                ),

            "revenue":

                round(

                    float(

                        row.revenue or 0

                    ),

                    2,

                ),

        }

        for row in top_product_rows

    ]

    # ======================================================

    # SIMPLE FORECAST

    # ======================================================

    daily_sales = [

        day["sales"]

        for day in last_7_days

    ]

    days_with_sales = sum(

        1

        for value in daily_sales

        if value > 0

    )

    total_7_days = sum(

        daily_sales

    )

    average_daily_sales = (

        total_7_days / 7

    )

    forecast = []

    for index in range(1, 8):

        forecast_date = (

            today

            + timedelta(days=index)

        )

        forecast.append({

            "date":

                forecast_date.isoformat(),

            "label":

                forecast_date.strftime(

                    "%b %d"

                ),

            "forecast_sales":

                round(

                    average_daily_sales,

                    2,

                ),

        })

    return {

        "sales_last_7_days":

            last_7_days,

        "top_products":

            top_products,

        "forecast":

            forecast,

        "forecast_ready":

            days_with_sales >= 3,

        "forecast_note":

            (

                "Baseline estimate using "

                "7-day average daily sales."

            ),

    }



# ==========================================================

# ANALYTICS V2 OVERVIEW

# ==========================================================

@router.get("/overview")

def analytics_overview(

    period: Literal[

        "today",

        "7d",

        "30d",

        "custom",

    ] = "7d",

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

    # ======================================================

    # CURRENT PERIOD

    # ======================================================

    orders = (

        db.query(models.Order)

        .filter(

            func.date(

                models.Order.created_at

            ) >= range_start,

            func.date(

                models.Order.created_at

            ) <= range_end,

            models.Order.status

            == "completed",

        )

        .all()

    )

    total_orders = len(

        orders

    )

    total_revenue = sum(

        float(

            order.total_amount

        )

        for order in orders

    )

    average_order_value = (

        calculate_aov(

            total_revenue,

            total_orders,

        )

    )

    # ======================================================

    # POS

    # ======================================================

    pos_orders_list = [

        order

        for order in orders

        if order.order_channel

        == "POS"

    ]

    pos_orders = len(

        pos_orders_list

    )

    pos_revenue = sum(

        float(

            order.total_amount

        )

        for order in pos_orders_list

    )

    pos_aov = calculate_aov(

        pos_revenue,

        pos_orders,

    )

    # ======================================================

    # ONLINE

    # ======================================================

    online_orders_list = [

        order

        for order in orders

        if order.order_channel

        == "ONLINE"

    ]

    online_orders = len(

        online_orders_list

    )

    online_revenue = sum(

        float(

            order.total_amount

        )

        for order in online_orders_list

    )

    online_aov = calculate_aov(

        online_revenue,

        online_orders,

    )

    # ======================================================

    # WALK-IN / GUEST

    # ======================================================

    guest_walkin_orders_list = [

        order

        for order in orders

        if order.customer_id is None

    ]

    guest_walkin_orders = len(

        guest_walkin_orders_list

    )

    guest_walkin_revenue = sum(

        float(

            order.total_amount

        )

        for order

        in guest_walkin_orders_list

    )

    # ======================================================

    # REGISTERED CUSTOMERS

    # ======================================================

    registered_orders_list = [

        order

        for order in orders

        if order.customer_id

        is not None

    ]

    registered_orders = len(

        registered_orders_list

    )

    registered_revenue = sum(

        float(

            order.total_amount

        )

        for order

        in registered_orders_list

    )

    registered_customer_ids = {

        order.customer_id

        for order

        in registered_orders_list

        if order.customer_id

        is not None

    }

    unique_registered_customers = len(

        registered_customer_ids

    )

    # ======================================================

    # CHANNEL × CUSTOMER TYPE

    # ======================================================

    pos_walkin = [

        order

        for order in orders

        if (

            order.order_channel

            == "POS"

            and order.customer_id

            is None

        )

    ]

    pos_registered = [

        order

        for order in orders

        if (

            order.order_channel

            == "POS"

            and order.customer_id

            is not None

        )

    ]

    online_guest = [

        order

        for order in orders

        if (

            order.order_channel

            == "ONLINE"

            and order.customer_id

            is None

        )

    ]

    online_registered = [

        order

        for order in orders

        if (

            order.order_channel

            == "ONLINE"

            and order.customer_id

            is not None

        )

    ]

    # ======================================================

    # DAILY SALES TREND

    # ======================================================

    daily_rows = (

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

            func.date(

                models.Order.created_at

            ) >= range_start,

            func.date(

                models.Order.created_at

            ) <= range_end,

            models.Order.status

            == "completed",

        )

        .group_by(

            func.date(

                models.Order.created_at

            )

        )

        .order_by(

            func.date(

                models.Order.created_at

            )

        )

        .all()

    )

    daily_sales_map = {

        str(row.sale_date): {

            "sales":

                float(

                    row.sales or 0

                ),

            "orders":

                int(

                    row.orders or 0

                ),

        }

        for row in daily_rows

    }

    daily_sales = []

    for index in range(

        total_days

    ):

        current_date = (

            range_start

            + timedelta(days=index)

        )

        key = (

            current_date.isoformat()

        )

        data = daily_sales_map.get(

            key,

            {

                "sales": 0,

                "orders": 0,

            },

        )

        daily_sales.append({

            "date":

                key,

            "label":

                current_date.strftime(

                    "%b %d"

                ),

            "sales":

                round(

                    data["sales"],

                    2,

                ),

            "orders":

                data["orders"],

        })

    # ======================================================

    # TOTAL UNITS SOLD

    # ======================================================

    units_sold_result = (

        db.query(

            func.sum(

                models.OrderItem.quantity

            )

        )

        .join(

            models.Order,

            models.Order.id

            == models.OrderItem.order_id,

        )

        .filter(

            func.date(

                models.Order.created_at

            ) >= range_start,

            func.date(

                models.Order.created_at

            ) <= range_end,

            models.Order.status

            == "completed",

        )

        .scalar()

    )

    units_sold = int(

        units_sold_result or 0

    )

    # ======================================================

    # TOP PRODUCTS

    # ======================================================

    top_product_rows = (

        db.query(

            models.OrderItem.product_name,

            func.sum(

                models.OrderItem.quantity

            ).label("quantity"),

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

            func.date(

                models.Order.created_at

            ) >= range_start,

            func.date(

                models.Order.created_at

            ) <= range_end,

            models.Order.status

            == "completed",

        )

        .group_by(

            models.OrderItem.product_name

        )

        .order_by(

            func.sum(

                models.OrderItem.quantity

            ).desc()

        )

        .limit(10)

        .all()

    )

    top_products = [

        {

            "name":

                row.product_name,

            "quantity":

                int(

                    row.quantity or 0

                ),

            "revenue":

                round(

                    float(

                        row.revenue or 0

                    ),

                    2,

                ),

        }

        for row in top_product_rows

    ]

    # ======================================================

    # PREVIOUS PERIOD

    # ======================================================

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

    previous_orders_list = get_orders_for_period(
        db,
        previous_start,
        previous_end,
    )

    previous_channels = build_channel_breakdown(
        previous_orders_list
    )

    previous_segments = build_segment_breakdown(
        previous_orders_list
    )

    previous_daily_sales = get_daily_sales_for_period(
        db,
        previous_start,
        previous_end,
    )

    current_top_product_names = [
        product["name"]
        for product in top_products
    ]

    previous_top_products = get_product_performance_for_period(
        db,
        previous_start,
        previous_end,
        product_names=current_top_product_names,
    )

    # ======================================================

    # PERIOD CHANGE

    # ======================================================

    revenue_change_percent = (

        calculate_change_percent(

            total_revenue,

            previous_metrics[

                "total_revenue"

            ],

        )

    )

    orders_change_percent = (

        calculate_change_percent(

            float(total_orders),

            float(

                previous_metrics[

                    "total_orders"

                ]

            ),

        )

    )

    aov_change_percent = (

        calculate_change_percent(

            average_order_value,

            previous_metrics[

                "average_order_value"

            ],

        )

    )

    units_change_percent = (

        calculate_change_percent(

            float(units_sold),

            float(

                previous_metrics[

                    "units_sold"

                ]

            ),

        )

    )

    # ======================================================

    # RESPONSE

    # ======================================================

    return {

        # PERIOD

        "period":

            period,

        "start_date":

            range_start.isoformat(),

        "end_date":

            range_end.isoformat(),

        "days":

            total_days,

        # OVERVIEW

        "total_revenue":

            round(

                total_revenue,

                2,

            ),

        "total_orders":

            total_orders,

        "average_order_value":

            average_order_value,

        "units_sold":

            units_sold,

        # CHANNELS

        "pos_revenue":

            round(

                pos_revenue,

                2,

            ),

        "pos_orders":

            pos_orders,

        "pos_aov":

            pos_aov,

        "online_revenue":

            round(

                online_revenue,

                2,

            ),

        "online_orders":

            online_orders,

        "online_aov":

            online_aov,

        # CUSTOMER MIX

        "guest_walkin_orders":

            guest_walkin_orders,

        "guest_walkin_revenue":

            round(

                guest_walkin_revenue,

                2,

            ),

        "registered_orders":

            registered_orders,

        "registered_revenue":

            round(

                registered_revenue,

                2,

            ),

        "unique_registered_customers":

            unique_registered_customers,

        # SEGMENTS

        "segments": {

            "pos_walkin": {

                "orders":

                    len(

                        pos_walkin

                    ),

                "revenue":

                    round(

                        sum(

                            float(

                                order.total_amount

                            )

                            for order

                            in pos_walkin

                        ),

                        2,

                    ),

            },

            "pos_registered": {

                "orders":

                    len(

                        pos_registered

                    ),

                "revenue":

                    round(

                        sum(

                            float(

                                order.total_amount

                            )

                            for order

                            in pos_registered

                        ),

                        2,

                    ),

            },

            "online_guest": {

                "orders":

                    len(

                        online_guest

                    ),

                "revenue":

                    round(

                        sum(

                            float(

                                order.total_amount

                            )

                            for order

                            in online_guest

                        ),

                        2,

                    ),

            },

            "online_registered": {

                "orders":

                    len(

                        online_registered

                    ),

                "revenue":

                    round(

                        sum(

                            float(

                                order.total_amount

                            )

                            for order

                            in online_registered

                        ),

                        2,

                    ),

            },

        },

        # CHART DATA

        "daily_sales":

            daily_sales,

        "top_products":

            top_products,

        # PREVIOUS PERIOD BREAKDOWNS

        "previous_daily_sales":

            previous_daily_sales,

        "previous_top_products":

            previous_top_products,

        "previous_segments":

            previous_segments,

        "previous_channels":

            previous_channels,

        # PREVIOUS PERIOD COMPARISON

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