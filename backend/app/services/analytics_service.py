from datetime import date, timedelta
from typing import Literal

from sqlalchemy.orm import Session

from ..repositories.analytics_repository import (
    get_daily_sales_for_period,
    get_orders_for_period,
    get_period_metrics,
    get_product_performance_for_period,
)
from ..utils.analytics_helpers import (
    build_channel_breakdown,
    build_segment_breakdown,
    calculate_change_percent,
    get_registration_breakdown,
    resolve_date_range,
)


AnalyticsPeriod = Literal[
    "today",
    "7d",
    "30d",
    "custom",
]


def get_dashboard_analytics(
    db: Session,
):
    today = date.today()

    start_date = (
        today - timedelta(days=6)
    )

    last_7_days = (
        get_daily_sales_for_period(
            db,
            start_date,
            today,
        )
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

    forecast = []

    for index in range(1, 8):
        forecast_date = (
            today
            + timedelta(days=index)
        )

        forecast.append(
            {
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
            }
        )

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


def get_analytics_overview(
    db: Session,
    period: AnalyticsPeriod,
    start_date: date | None,
    end_date: date | None,
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
        get_orders_for_period(
            db,
            range_start,
            range_end,
        )
    )

    current_metrics = (
        get_period_metrics(
            db,
            range_start,
            range_end,
        )
    )

    channels = (
        build_channel_breakdown(
            orders
        )
    )

    segments = (
        build_segment_breakdown(
            orders
        )
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

    # ======================================================
    # PERIOD COMPARISON
    # ======================================================

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

    # ======================================================
    # RESPONSE
    # ======================================================

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

        # CHANNELS

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

        # CUSTOMER REGISTRATION
        #
        # These old field names are kept
        # temporarily for frontend compatibility.
        #
        # They represent:
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

        # SEGMENTS

        "segments":
            segments,

        # CURRENT CHART DATA

        "daily_sales":
            daily_sales,

        "top_products":
            top_products,

        # PREVIOUS PERIOD DATA

        "previous_daily_sales":
            previous_daily_sales,

        "previous_top_products":
            previous_top_products,

        "previous_segments":
            previous_segments,

        "previous_channels":
            previous_channels,

        # COMPARISON

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