from datetime import date, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session

from .. import models
from ..utils.analytics_helpers import calculate_aov


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
            func.date(models.Order.created_at) >= range_start,
            func.date(models.Order.created_at) <= range_end,
            models.Order.status == "completed",
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
            func.date(models.Order.created_at) >= range_start,
            func.date(models.Order.created_at) <= range_end,
            models.Order.status == "completed",
        )
        .scalar()
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
            calculate_aov(
                total_revenue,
                total_orders,
            ),

        "units_sold":
            int(
                units_sold_result or 0
            ),
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
            func.date(models.Order.created_at) >= range_start,
            func.date(models.Order.created_at) <= range_end,
            models.Order.status == "completed",
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

        key = (
            current_date.isoformat()
        )

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
    limit: int | None = None,
):
    quantity_sum = func.sum(
        models.OrderItem.quantity
    )

    query = (
        db.query(
            models.OrderItem.product_name,

            quantity_sum.label(
                "quantity"
            ),

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
        query = query.limit(
            limit
        )

    rows = query.all()

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