from datetime import date, timedelta


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
    if previous == 0:
        return 0.0 if current == 0 else None

    return round(
        (
            (current - previous)
            / previous
        )
        * 100,
        2,
    )


def resolve_date_range(
    period: str,
    start_date: date | None,
    end_date: date | None,
) -> tuple[date, date]:
    today = date.today()

    if period == "today":
        return today, today

    if period == "7d":
        return (
            today - timedelta(days=6),
            today,
        )

    if period == "30d":
        return (
            today - timedelta(days=29),
            today,
        )

    if period != "custom":
        raise ValueError(
            f"Unsupported analytics period: {period}."
        )

    if start_date is None or end_date is None:
        raise ValueError(
            "start_date and end_date are required "
            "for custom period."
        )

    if start_date > end_date:
        raise ValueError(
            "start_date cannot be later than end_date."
        )

    total_days = (
        end_date - start_date
    ).days + 1

    if total_days > 366:
        raise ValueError(
            "Custom analytics range cannot exceed 366 days."
        )

    return start_date, end_date


def build_channel_breakdown(
    orders,
):
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
            "revenue": round(
                revenue,
                2,
            ),
            "aov": calculate_aov(
                revenue,
                len(items),
            ),
        }

    return {
        "pos": summarize(
            pos_orders
        ),
        "online": summarize(
            online_orders
        ),
    }


def build_segment_breakdown(
    orders,
):
    def summarize(items):
        return {
            "orders": len(items),
            "revenue": round(
                sum(
                    float(
                        order.total_amount
                    )
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


def get_registration_breakdown(
    orders,
):
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
        "unregistered_orders":
            len(unregistered),

        "unregistered_revenue":
            round(
                sum(
                    float(
                        order.total_amount
                    )
                    for order in unregistered
                ),
                2,
            ),

        "registered_orders":
            len(registered),

        "registered_revenue":
            round(
                sum(
                    float(
                        order.total_amount
                    )
                    for order in registered
                ),
                2,
            ),

        "unique_registered_customers":
            len(
                registered_customer_ids
            ),
    }