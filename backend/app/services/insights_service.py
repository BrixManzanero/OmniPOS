"""Rule-based business insight engine for OmniPOS Zero.

Reads sales, inventory and customer history, then turns the
patterns it finds into merchant-approvable promotion drafts.
No recommendation is ever applied automatically: every
suggestion is returned as a DRAFT the operator must approve.
"""

from datetime import datetime, timedelta

from sqlalchemy import extract, func
from sqlalchemy.orm import Session

from .. import models


# =========================
# TUNING CONSTANTS
# =========================

LOOKBACK_DAYS = 30

# An hour block is "weak" when it earns less than this
# share of the average active hour.
WEAK_HOUR_RATIO = 0.6

WEAK_HOUR_WINDOW = 3

# A product is slow-moving when it sells at most this many
# units while still holding at least this much stock.
SLOW_MOVER_MAX_UNITS = 5
SLOW_MOVER_MIN_STOCK = 20

# Online is under-performing below this revenue share.
ONLINE_SHARE_TARGET = 0.30

# A top seller at or below this stock level is at risk.
LOW_STOCK_THRESHOLD = 10

# Customers inactive this long are considered dormant.
DORMANT_DAYS = 45


# =========================
# HELPERS
# =========================

def _period_start() -> datetime:
    return datetime.utcnow() - timedelta(
        days=LOOKBACK_DAYS
    )


def _peso(value: float) -> str:
    return f"PHP {value:,.2f}"


def _hour_label(hour: int) -> str:
    return f"{hour:02d}:00"


def _completed_orders(db: Session, since: datetime):
    return (
        db.query(models.Order)
        .filter(
            models.Order.status == "completed",
            models.Order.created_at >= since,
        )
    )


# =========================
# RULE 1 - WEAK SALES HOURS
# =========================

def analyze_weak_hours(
    db: Session,
    since: datetime,
) -> dict | None:
    rows = (
        db.query(
            extract(
                "hour",
                models.Order.created_at,
            ).label("hour"),
            func.sum(
                models.Order.total_amount
            ).label("revenue"),
            func.count(
                models.Order.id
            ).label("orders"),
        )
        .filter(
            models.Order.status == "completed",
            models.Order.created_at >= since,
        )
        .group_by("hour")
        .all()
    )

    if len(rows) < WEAK_HOUR_WINDOW:
        return None

    revenue_by_hour = {
        int(row.hour): float(row.revenue or 0)
        for row in rows
    }

    active_hours = sorted(revenue_by_hour)

    average_hour_revenue = (
        sum(revenue_by_hour.values())
        / len(revenue_by_hour)
    )

    if average_hour_revenue <= 0:
        return None

    # Find the weakest run of consecutive trading hours.
    weakest_block = None
    weakest_total = None

    for index in range(
        len(active_hours) - WEAK_HOUR_WINDOW + 1
    ):
        block = active_hours[
            index : index + WEAK_HOUR_WINDOW
        ]

        # Only score genuinely consecutive hours.
        if block[-1] - block[0] != WEAK_HOUR_WINDOW - 1:
            continue

        total = sum(
            revenue_by_hour[hour]
            for hour in block
        )

        if weakest_total is None or total < weakest_total:
            weakest_total = total
            weakest_block = block

    if not weakest_block:
        return None

    block_average = weakest_total / len(weakest_block)

    if block_average >= (
        average_hour_revenue * WEAK_HOUR_RATIO
    ):
        return None

    start_hour = weakest_block[0]
    end_hour = weakest_block[-1]

    gap_percent = round(
        (
            1
            - (
                block_average
                / average_hour_revenue
            )
        )
        * 100
    )

    return {
        "id": "weak_hours",

        "title": "Weak sales window detected",

        "summary": (
            f"Between {_hour_label(start_hour)} and "
            f"{_hour_label(end_hour)}, sales run about "
            f"{gap_percent}% below your average trading hour. "
            "A limited-time online offer during this window "
            "can pull demand into the quiet period without "
            "discounting your busy hours."
        ),

        "severity": "opportunity",

        "metrics": [
            {
                "label": "Weak window",
                "value": (
                    f"{_hour_label(start_hour)} - "
                    f"{_hour_label(end_hour)}"
                ),
            },
            {
                "label": "Average per hour in window",
                "value": _peso(block_average),
            },
            {
                "label": "Average trading hour",
                "value": _peso(average_hour_revenue),
            },
        ],

        "suggested_promotion": {
            "name": (
                f"Quiet Hours Boost "
                f"({_hour_label(start_hour)}-"
                f"{_hour_label(end_hour)})"
            ),

            "description": (
                "Auto-suggested from weak-hour analysis of "
                f"the last {LOOKBACK_DAYS} days."
            ),

            "discount_type": "PERCENT",
            "discount_value": 15,

            "target_type": "ALL",
            "target_product_id": None,
            "target_category": None,

            "channel": "ONLINE",

            "start_date": None,
            "end_date": None,
            "start_hour": start_hour,
            "end_hour": end_hour,

            "status": "DRAFT",
            "source": "AI",
        },
    }


# =========================
# RULE 2 - SLOW-MOVING STOCK
# =========================

def analyze_slow_movers(
    db: Session,
    since: datetime,
) -> dict | None:
    sold_rows = (
        db.query(
            models.OrderItem.product_id,
            func.sum(
                models.OrderItem.quantity
            ).label("units"),
        )
        .join(
            models.Order,
            models.Order.id
            == models.OrderItem.order_id,
        )
        .filter(
            models.Order.status == "completed",
            models.Order.created_at >= since,
        )
        .group_by(
            models.OrderItem.product_id
        )
        .all()
    )

    units_by_product = {
        row.product_id: int(row.units or 0)
        for row in sold_rows
    }

    products = (
        db.query(models.Product)
        .filter(
            models.Product.is_active.is_(True)
        )
        .all()
    )

    slow_movers = [
        {
            "product": product,
            "units": units_by_product.get(
                product.id,
                0,
            ),
        }
        for product in products
        if units_by_product.get(product.id, 0)
        <= SLOW_MOVER_MAX_UNITS
        and product.stock >= SLOW_MOVER_MIN_STOCK
    ]

    if not slow_movers:
        return None

    # Worst offender first: most stock, least movement.
    slow_movers.sort(
        key=lambda entry: (
            -entry["product"].stock,
            entry["units"],
        )
    )

    worst = slow_movers[0]
    worst_product = worst["product"]

    metrics = [
        {
            "label": entry["product"].name,
            "value": (
                f"{entry['units']} sold, "
                f"{entry['product'].stock} in stock"
            ),
        }
        for entry in slow_movers[:4]
    ]

    return {
        "id": "slow_movers",

        "title": (
            f"{len(slow_movers)} product"
            f"{'s' if len(slow_movers) > 1 else ''} "
            "tying up stock"
        ),

        "summary": (
            f"{worst_product.name} is holding "
            f"{worst_product.stock} units but sold only "
            f"{worst['units']} in the last {LOOKBACK_DAYS} "
            "days. Discounting the slowest mover frees up "
            "shelf space and working capital before the "
            "stock ages further."
        ),

        "severity": "opportunity",

        "metrics": metrics,

        "suggested_promotion": {
            "name": (
                f"Move the Stock: {worst_product.name}"
            ),

            "description": (
                "Auto-suggested from slow-moving stock "
                f"analysis of the last {LOOKBACK_DAYS} days."
            ),

            "discount_type": "PERCENT",
            "discount_value": 20,

            "target_type": "PRODUCT",
            "target_product_id": worst_product.id,
            "target_category": None,

            "channel": "ALL",

            "start_date": None,
            "end_date": None,
            "start_hour": None,
            "end_hour": None,

            "status": "DRAFT",
            "source": "AI",
        },
    }


# =========================
# RULE 3 - CHANNEL BALANCE
# =========================

def analyze_channel_gap(
    db: Session,
    since: datetime,
) -> dict | None:
    rows = (
        db.query(
            models.Order.order_channel,
            func.sum(
                models.Order.total_amount
            ).label("revenue"),
        )
        .filter(
            models.Order.status == "completed",
            models.Order.created_at >= since,
        )
        .group_by(
            models.Order.order_channel
        )
        .all()
    )

    revenue_by_channel = {
        row.order_channel: float(row.revenue or 0)
        for row in rows
    }

    total_revenue = sum(
        revenue_by_channel.values()
    )

    if total_revenue <= 0:
        return None

    online_revenue = revenue_by_channel.get(
        "ONLINE",
        0.0,
    )

    pos_revenue = revenue_by_channel.get(
        "POS",
        0.0,
    )

    online_share = online_revenue / total_revenue

    if online_share >= ONLINE_SHARE_TARGET:
        return None

    return {
        "id": "channel_gap",

        "title": "Online channel is under-used",

        "summary": (
            "Online orders account for only "
            f"{online_share * 100:.1f}% of revenue over the "
            f"last {LOOKBACK_DAYS} days. An online-only "
            "offer grows that channel without cutting "
            "margin on walk-in sales you already win."
        ),

        "severity": "opportunity",

        "metrics": [
            {
                "label": "Online revenue",
                "value": _peso(online_revenue),
            },
            {
                "label": "POS revenue",
                "value": _peso(pos_revenue),
            },
            {
                "label": "Online share",
                "value": f"{online_share * 100:.1f}%",
            },
        ],

        "suggested_promotion": {
            "name": "Online Exclusive Offer",

            "description": (
                "Auto-suggested from channel-mix analysis "
                f"of the last {LOOKBACK_DAYS} days."
            ),

            "discount_type": "PERCENT",
            "discount_value": 10,

            "target_type": "ALL",
            "target_product_id": None,
            "target_category": None,

            "channel": "ONLINE",

            "start_date": None,
            "end_date": None,
            "start_hour": None,
            "end_hour": None,

            "status": "DRAFT",
            "source": "AI",
        },
    }


# =========================
# RULE 4 - TOP SELLERS AT RISK
# =========================

def analyze_stock_risk(
    db: Session,
    since: datetime,
) -> dict | None:
    rows = (
        db.query(
            models.OrderItem.product_id,
            models.OrderItem.product_name,
            func.sum(
                models.OrderItem.quantity
            ).label("units"),
        )
        .join(
            models.Order,
            models.Order.id
            == models.OrderItem.order_id,
        )
        .filter(
            models.Order.status == "completed",
            models.Order.created_at >= since,
        )
        .group_by(
            models.OrderItem.product_id,
            models.OrderItem.product_name,
        )
        .order_by(
            func.sum(
                models.OrderItem.quantity
            ).desc()
        )
        .limit(5)
        .all()
    )

    if not rows:
        return None

    product_ids = [
        row.product_id
        for row in rows
    ]

    stock_by_product = {
        product.id: product
        for product in (
            db.query(models.Product)
            .filter(
                models.Product.id.in_(
                    product_ids
                )
            )
            .all()
        )
    }

    at_risk = [
        {
            "name": row.product_name,
            "units": int(row.units or 0),
            "stock": stock_by_product[
                row.product_id
            ].stock,
        }
        for row in rows
        if row.product_id in stock_by_product
        and stock_by_product[row.product_id].stock
        <= LOW_STOCK_THRESHOLD
    ]

    if not at_risk:
        return None

    names = ", ".join(
        entry["name"]
        for entry in at_risk
    )

    return {
        "id": "stock_risk",

        "title": "Best sellers are running low",

        "summary": (
            f"{names} rank among your top sellers but are "
            "down to single-digit or near-empty stock. "
            "Restock before promoting anything else - a "
            "campaign that drives demand you cannot fill "
            "costs more than it earns."
        ),

        "severity": "warning",

        "metrics": [
            {
                "label": entry["name"],
                "value": (
                    f"{entry['units']} sold, "
                    f"{entry['stock']} left"
                ),
            }
            for entry in at_risk
        ],

        # Deliberately no promotion: the fix is restocking.
        "suggested_promotion": None,
    }


# =========================
# RULE 5 - DORMANT CUSTOMERS
# =========================

def analyze_dormant_customers(
    db: Session,
    since: datetime,
) -> dict | None:
    cutoff = datetime.utcnow() - timedelta(
        days=DORMANT_DAYS
    )

    rows = (
        db.query(
            models.Order.customer_id,
            func.max(
                models.Order.created_at
            ).label("last_order"),
        )
        .filter(
            models.Order.status == "completed",
            models.Order.customer_id.isnot(None),
        )
        .group_by(
            models.Order.customer_id
        )
        .all()
    )

    if not rows:
        return None

    dormant = [
        row
        for row in rows
        if row.last_order
        and row.last_order < cutoff
    ]

    if not dormant:
        return None

    dormant_share = len(dormant) / len(rows)

    return {
        "id": "dormant_customers",

        "title": (
            f"{len(dormant)} customers have gone quiet"
        ),

        "summary": (
            f"{len(dormant)} of {len(rows)} registered "
            f"customers ({dormant_share * 100:.0f}%) have "
            f"not ordered in over {DORMANT_DAYS} days. A "
            "short win-back offer is usually cheaper than "
            "acquiring a replacement customer."
        ),

        "severity": "opportunity",

        "metrics": [
            {
                "label": "Dormant customers",
                "value": str(len(dormant)),
            },
            {
                "label": "Customers with order history",
                "value": str(len(rows)),
            },
            {
                "label": "Inactivity threshold",
                "value": f"{DORMANT_DAYS} days",
            },
        ],

        "suggested_promotion": {
            "name": "Win-Back Offer",

            "description": (
                "Auto-suggested from customer inactivity "
                "analysis."
            ),

            "discount_type": "PERCENT",
            "discount_value": 12,

            "target_type": "ALL",
            "target_product_id": None,
            "target_category": None,

            "channel": "ALL",

            "start_date": None,
            "end_date": None,
            "start_hour": None,
            "end_hour": None,

            "status": "DRAFT",
            "source": "AI",
        },
    }


# =========================
# ENGINE
# =========================

RULES = [
    analyze_stock_risk,
    analyze_weak_hours,
    analyze_slow_movers,
    analyze_channel_gap,
    analyze_dormant_customers,
]


def get_insights(db: Session) -> dict:
    since = _period_start()

    orders_analyzed = (
        _completed_orders(db, since).count()
    )

    insights = []

    for rule in RULES:
        result = rule(db, since)

        if result:
            insights.append(result)

    if not insights:
        insights.append(
            {
                "id": "all_clear",

                "title": "Nothing needs attention",

                "summary": (
                    "No weak hours, slow movers, channel "
                    "gaps or stock risks turned up in the "
                    f"last {LOOKBACK_DAYS} days. Check back "
                    "after the next trading week."
                ),

                "severity": "info",

                "metrics": [
                    {
                        "label": "Orders analyzed",
                        "value": str(orders_analyzed),
                    },
                ],

                "suggested_promotion": None,
            }
        )

    return {
        "generated_at": datetime.utcnow(),
        "period_days": LOOKBACK_DAYS,
        "orders_analyzed": orders_analyzed,
        "insights": insights,
    }
