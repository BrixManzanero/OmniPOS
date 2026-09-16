from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..core.database import get_db
from .. import models


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


LOW_STOCK_THRESHOLD = 5


def calculate_aov(
    revenue: float,
    orders: int
) -> float:
    if orders == 0:
        return 0.0

    return round(
        revenue / orders,
        2
    )


@router.get("/summary")
def get_dashboard_summary(
    db: Session = Depends(get_db)
):
    today = date.today()


    # =========================
    # TODAY'S COMPLETED ORDERS
    # =========================

    todays_orders = (
        db.query(models.Order)
        .filter(
            func.date(
                models.Order.created_at
            ) == today,
            models.Order.status
            == "completed",
        )
        .all()
    )


    # =========================
    # TODAY'S SALES
    # =========================

    todays_sales = sum(
        float(order.total_amount)
        for order in todays_orders
    )


    orders_today = len(
        todays_orders
    )


    # =========================
    # POS ORDERS
    # =========================

    pos_orders_list = [
        order
        for order in todays_orders
        if order.order_channel == "POS"
    ]


    pos_orders = len(
        pos_orders_list
    )


    pos_revenue = sum(
        float(order.total_amount)
        for order in pos_orders_list
    )


    pos_aov = calculate_aov(
        pos_revenue,
        pos_orders
    )


    # =========================
    # ONLINE ORDERS
    # =========================

    online_orders_list = [
        order
        for order in todays_orders
        if order.order_channel
        == "ONLINE"
    ]


    online_orders = len(
        online_orders_list
    )


    online_revenue = sum(
        float(order.total_amount)
        for order in online_orders_list
    )


    online_aov = calculate_aov(
        online_revenue,
        online_orders
    )


    # =========================
    # WALK-IN / GUEST ORDERS
    # =========================
    #
    # POS + customer_id NULL
    # = Walk-in
    #
    # ONLINE + customer_id NULL
    # = Guest
    #
    # Both are unregistered customers.
    # =========================

    guest_walkin_orders_list = [
        order
        for order in todays_orders
        if order.customer_id is None
    ]


    guest_walkin_orders = len(
        guest_walkin_orders_list
    )


    guest_walkin_revenue = sum(
        float(order.total_amount)
        for order
        in guest_walkin_orders_list
    )


    # =========================
    # REGISTERED CUSTOMER ORDERS
    # =========================

    registered_orders_list = [
        order
        for order in todays_orders
        if order.customer_id is not None
    ]


    registered_orders = len(
        registered_orders_list
    )


    registered_revenue = sum(
        float(order.total_amount)
        for order
        in registered_orders_list
    )


    # =========================
    # CHANNEL × CUSTOMER TYPE
    # =========================

    pos_walkin_orders_list = [
        order
        for order in todays_orders
        if (
            order.order_channel == "POS"
            and order.customer_id is None
        )
    ]


    pos_registered_orders_list = [
        order
        for order in todays_orders
        if (
            order.order_channel == "POS"
            and order.customer_id is not None
        )
    ]


    online_guest_orders_list = [
        order
        for order in todays_orders
        if (
            order.order_channel == "ONLINE"
            and order.customer_id is None
        )
    ]


    online_registered_orders_list = [
        order
        for order in todays_orders
        if (
            order.order_channel == "ONLINE"
            and order.customer_id is not None
        )
    ]


    # =========================
    # LOW STOCK
    # =========================

    low_stock_count = (
        db.query(models.Product)
        .filter(
            models.Product.is_active.is_(
                True
            ),
            models.Product.stock
            <= LOW_STOCK_THRESHOLD
        )
        .count()
    )


    # =========================
    # ACTIVE PRODUCTS
    # =========================

    total_products = (
        db.query(models.Product)
        .filter(
            models.Product.is_active.is_(
                True
            )
        )
        .count()
    )


    # =========================
    # ACTIVE CUSTOMERS
    # =========================

    total_customers = (
        db.query(models.Customer)
        .filter(
            models.Customer.is_active.is_(
                True
            )
        )
        .count()
    )


    # =========================
    # RESPONSE
    # =========================

    return {

        # EXISTING DASHBOARD KPIs
        "todays_sales": round(
            todays_sales,
            2
        ),

        "orders_today":
            orders_today,

        "customers":
            total_customers,

        "low_stock":
            low_stock_count,

        "total_products":
            total_products,


        # =========================
        # CHANNEL PERFORMANCE
        # =========================

        "pos_revenue": round(
            pos_revenue,
            2
        ),

        "online_revenue": round(
            online_revenue,
            2
        ),

        "pos_orders":
            pos_orders,

        "online_orders":
            online_orders,

        "pos_aov":
            pos_aov,

        "online_aov":
            online_aov,


        # =========================
        # CUSTOMER MIX
        # =========================

        "guest_walkin_orders":
            guest_walkin_orders,

        "registered_orders":
            registered_orders,

        "guest_walkin_revenue": round(
            guest_walkin_revenue,
            2
        ),

        "registered_revenue": round(
            registered_revenue,
            2
        ),


        # =========================
        # CHANNEL × CUSTOMER TYPE
        # =========================

        "pos_walkin_orders":
            len(
                pos_walkin_orders_list
            ),

        "pos_walkin_revenue": round(
            sum(
                float(
                    order.total_amount
                )
                for order
                in pos_walkin_orders_list
            ),
            2
        ),


        "pos_registered_orders":
            len(
                pos_registered_orders_list
            ),

        "pos_registered_revenue": round(
            sum(
                float(
                    order.total_amount
                )
                for order
                in pos_registered_orders_list
            ),
            2
        ),


        "online_guest_orders":
            len(
                online_guest_orders_list
            ),

        "online_guest_revenue": round(
            sum(
                float(
                    order.total_amount
                )
                for order
                in online_guest_orders_list
            ),
            2
        ),


        "online_registered_orders":
            len(
                online_registered_orders_list
            ),

        "online_registered_revenue": round(
            sum(
                float(
                    order.total_amount
                )
                for order
                in online_registered_orders_list
            ),
            2
        ),
    }