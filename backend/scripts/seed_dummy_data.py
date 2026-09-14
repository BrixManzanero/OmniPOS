"""
Seed OmniPOS Zero with realistic dummy data.

This generates products, customers, orders, order items, and inventory
movements for a configurable number of months, with business patterns
DELIBERATELY PLANTED so you can verify that any analytics or AI layer
you build actually finds what is really there.

Planted patterns (see PATTERN_MANIFEST at the bottom of the output):
  1. Afternoon lull      -> 2PM-4PM Manila time is clearly weak
  2. Two daily peaks     -> lunch (11AM-1PM) and dinner (5PM-7PM)
  3. Weekend uplift      -> Sat/Sun busier than Mon-Thu
  4. Channel shift       -> ONLINE share grows from ~20% to ~45%
  5. Slow movers         -> 2 SKUs that barely sell
  6. Promo spike         -> one 5-day surge
  7. Dead week           -> one 6-day slump (store disruption)
  8. Loyal cohort        -> ~14 customers with high repeat frequency

Usage (from the backend/ directory, venv active):

    python -m scripts.seed_dummy_data --reset
    python -m scripts.seed_dummy_data --reset --months 3
    python -m scripts.seed_dummy_data --reset --tz-mode local

Timestamp modes:
    utc   (default) Stores naive UTC, matching the app's current
                    datetime.utcnow default. Correct storage, but the
                    dashboard's date.today() comparison will shift
                    midnight-to-8AM Manila orders into the previous day.
                    Use this to reproduce and then verify the fix.
    local           Stores naive Manila local time. The dashboard will
                    look right today, but it is not what the running
                    app writes. Use only for UI demos.
"""

from __future__ import annotations

import argparse
import math
import random
import sys
from collections import defaultdict
from datetime import date, datetime, timedelta
from pathlib import Path

# Allow running as a plain script as well as with -m.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.database import SessionLocal  # noqa: E402
from app.models import (  # noqa: E402
    Customer,
    InventoryMovement,
    Order,
    OrderItem,
    Product,
)


# =========================================================
# CONFIG
# =========================================================

RANDOM_SEED = 20260914

MANILA_UTC_OFFSET_HOURS = 8

DEFAULT_MONTHS = 6

# Average orders per day at the start of the period.
BASE_ORDERS_PER_DAY = 16

# Compounding daily growth applied across the whole period.
DAILY_GROWTH_RATE = 0.0015

# Store hours, Manila local time. Last order starts before closing.
OPEN_HOUR = 9
CLOSE_HOUR = 21

# Hour-of-day demand weights (Manila local). The 14-16 dip is the
# planted "weak afternoon" that an AI layer should surface.
HOUR_WEIGHTS = {
    9: 0.55,
    10: 0.80,
    11: 1.50,
    12: 1.70,
    13: 1.20,
    14: 0.35,
    15: 0.30,
    16: 0.40,
    17: 1.30,
    18: 1.60,
    19: 1.35,
    20: 0.85,
}

# Monday = 0 ... Sunday = 6
WEEKDAY_WEIGHTS = {
    0: 0.85,
    1: 0.85,
    2: 0.90,
    3: 0.95,
    4: 1.15,
    5: 1.35,
    6: 1.25,
}

# ONLINE share of orders, linearly interpolated start -> end.
ONLINE_SHARE_START = 0.20
ONLINE_SHARE_END = 0.45

# Share of orders attached to a registered customer, per channel.
POS_REGISTERED_SHARE = 0.25
ONLINE_REGISTERED_SHARE = 0.55

# Payment mix. Must stay inside the app's channel rules:
# POS allows cash/gcash/maya/card, ONLINE allows gcash/maya/card.
POS_PAYMENTS = {
    "cash": 0.45,
    "gcash": 0.30,
    "card": 0.15,
    "maya": 0.10,
}

ONLINE_PAYMENTS = {
    "gcash": 0.45,
    "card": 0.35,
    "maya": 0.20,
}

# Anomalies, expressed as a fraction of the way through the period.
PROMO_SPIKE_AT = 0.62
PROMO_SPIKE_DAYS = 5
PROMO_SPIKE_MULTIPLIER = 1.9

DEAD_WEEK_AT = 0.33
DEAD_WEEK_DAYS = 6
DEAD_WEEK_MULTIPLIER = 0.45

# Restock behaviour.
LOW_STOCK_TRIGGER = 8
RESTOCK_BATCH = 60

# Planted low-stock situation: this many SKUs stop being restocked
# for the final stretch, so the low-stock KPI and the Inventory page
# have something real to show.
LOW_STOCK_SKU_COUNT = 3
LOW_STOCK_WINDOW_DAYS = 12

# Rows per bulk insert. Keeps individual statements small enough for
# Supabase's pooler and statement timeout.
INSERT_CHUNK_SIZE = 1000


# =========================================================
# CATALOG
# =========================================================
# weight = relative sales velocity. The two 0.12 entries are the
# planted slow movers.

PRODUCT_CATALOG = [
    # name, sku, category, price, weight
    ("Wintermelon Milk Tea", "DRK-001", "Drinks", 110.0, 4.2),
    ("Okinawa Milk Tea", "DRK-002", "Drinks", 115.0, 3.8),
    ("Salted Caramel Latte", "DRK-003", "Drinks", 145.0, 3.0),
    ("Iced Spanish Latte", "DRK-004", "Drinks", 150.0, 3.4),
    ("Matcha Cream Float", "DRK-005", "Drinks", 160.0, 2.2),
    ("Barako Brewed Coffee", "DRK-006", "Drinks", 85.0, 2.6),
    ("Calamansi Iced Tea", "DRK-007", "Drinks", 75.0, 2.0),
    ("Hot Tsokolate", "DRK-008", "Drinks", 95.0, 0.12),
    ("Ube Cheese Pandesal", "BKY-001", "Bakery", 65.0, 3.6),
    ("Ensaymada", "BKY-002", "Bakery", 70.0, 2.8),
    ("Cheese Roll (6pcs)", "BKY-003", "Bakery", 120.0, 2.1),
    ("Banana Bread Slice", "BKY-004", "Bakery", 80.0, 1.9),
    ("Almond Croissant", "BKY-005", "Bakery", 135.0, 1.4),
    ("Mamon Tostado Pack", "BKY-006", "Bakery", 110.0, 0.12),
    ("Chicken Adobo Rice Bowl", "MEA-001", "Meals", 185.0, 3.3),
    ("Sisig Rice Bowl", "MEA-002", "Meals", 195.0, 3.1),
    ("Tapsilog", "MEA-003", "Meals", 175.0, 2.4),
    ("Beef Tapa Sandwich", "MEA-004", "Meals", 165.0, 1.8),
    ("Pancit Canton Solo", "MEA-005", "Meals", 140.0, 1.6),
    ("Cheesy Nachos", "SNK-001", "Snacks", 130.0, 2.3),
    ("Chicken Popcorn", "SNK-002", "Snacks", 125.0, 2.7),
    ("Fries Overload", "SNK-003", "Snacks", 145.0, 2.0),
    ("OmniPOS Tumbler", "MRC-001", "Merch", 450.0, 0.45),
    ("OmniPOS Tote Bag", "MRC-002", "Merch", 350.0, 0.35),
]

FIRST_NAMES = [
    "Andrea", "Miguel", "Sofia", "Rafael", "Bea", "Joshua", "Camille",
    "Paolo", "Trisha", "Nico", "Althea", "Gabriel", "Jasmine", "Emman",
    "Kirsten", "Dominic", "Patricia", "Lorenzo", "Mika", "Carlo",
    "Angelica", "Justin", "Danica", "Marco", "Kyla", "Renz", "Hannah",
    "Jerome", "Isabel", "Arvin", "Mariel", "Kenneth", "Cristine",
    "Leandro", "Yvonne", "Dexter", "Roselle", "Aldrin", "Charmaine",
    "Vincent", "Grace", "Julius", "Faith", "Noel", "Kathleen",
    "Bryan", "Micah", "Reggie", "Shaira", "Ivan", "Nadine", "Elmer",
    "Rhea", "Jomar", "Clarisse", "Ariel", "Denise", "Randy",
    "Lovely", "Gerald",
]

LAST_NAMES = [
    "Santos", "Reyes", "Cruz", "Bautista", "Ocampo", "Garcia",
    "Mendoza", "Torres", "Ramos", "Del Rosario", "Aquino", "Villanueva",
    "Castillo", "Navarro", "Salazar", "Domingo", "Flores", "Gonzales",
    "Rivera", "Lim", "Tan", "Chua", "Manalo", "Espiritu", "Dizon",
    "Alonzo", "Pascual", "Fernandez", "Marquez", "Bernardo",
]


# =========================================================
# HELPERS
# =========================================================

def weighted_choice(rng: random.Random, weights: dict):
    keys = list(weights)
    values = [weights[key] for key in keys]
    return rng.choices(keys, weights=values, k=1)[0]


def to_storage_datetime(
    local_dt: datetime,
    tz_mode: str,
) -> datetime:
    """Convert a Manila-local datetime to what gets written to the DB."""
    if tz_mode == "local":
        return local_dt

    return local_dt - timedelta(hours=MANILA_UTC_OFFSET_HOURS)


def build_customers(rng: random.Random, count: int):
    seen = set()
    customers = []

    while len(customers) < count:
        first = rng.choice(FIRST_NAMES)
        last = rng.choice(LAST_NAMES)
        name = f"{first} {last}"

        if name in seen:
            continue

        seen.add(name)

        handle = (
            f"{first.lower()}."
            f"{last.lower().replace(' ', '')}"
            f"{rng.randint(10, 99)}"
        )

        customers.append(
            {
                "name": name,
                "email": f"{handle}@example.com",
                "phone": f"09{rng.randint(10, 99)}{rng.randint(1000000, 9999999)}",
            }
        )

    return customers


def day_multiplier(
    current: date,
    start: date,
    total_days: int,
) -> float:
    """Trend + weekday + planted anomalies, combined."""
    elapsed = (current - start).days

    multiplier = math.pow(1.0 + DAILY_GROWTH_RATE, elapsed)
    multiplier *= WEEKDAY_WEIGHTS[current.weekday()]

    promo_start = start + timedelta(
        days=int(total_days * PROMO_SPIKE_AT)
    )
    if promo_start <= current < promo_start + timedelta(
        days=PROMO_SPIKE_DAYS
    ):
        multiplier *= PROMO_SPIKE_MULTIPLIER

    dead_start = start + timedelta(
        days=int(total_days * DEAD_WEEK_AT)
    )
    if dead_start <= current < dead_start + timedelta(
        days=DEAD_WEEK_DAYS
    ):
        multiplier *= DEAD_WEEK_MULTIPLIER

    return multiplier


def online_share_for(
    current: date,
    start: date,
    total_days: int,
) -> float:
    progress = (current - start).days / max(total_days - 1, 1)

    return (
        ONLINE_SHARE_START
        + (ONLINE_SHARE_END - ONLINE_SHARE_START) * progress
    )


# =========================================================
# SEEDING
# =========================================================

def reset_tables(db) -> None:
    db.query(OrderItem).delete(synchronize_session=False)
    db.query(InventoryMovement).delete(synchronize_session=False)
    db.query(Order).delete(synchronize_session=False)
    db.query(Product).delete(synchronize_session=False)
    db.query(Customer).delete(synchronize_session=False)
    db.commit()


def seed(
    db,
    months: int,
    tz_mode: str,
    customer_count: int,
) -> dict:
    rng = random.Random(RANDOM_SEED)

    today_local = date.today()
    total_days = months * 30
    start_day = today_local - timedelta(days=total_days - 1)

    opening_local = datetime.combine(
        start_day,
        datetime.min.time(),
    ).replace(hour=OPEN_HOUR)

    # ---- Products -------------------------------------------------
    products = []
    product_weights = {}

    for name, sku, category, price, weight in PRODUCT_CATALOG:
        product = Product(
            name=name,
            sku=sku,
            category=category,
            price=price,
            stock=RESTOCK_BATCH * 2,
            is_active=True,
        )
        db.add(product)
        products.append(product)

    db.flush()

    for product, entry in zip(products, PRODUCT_CATALOG):
        product_weights[product.id] = entry[4]

    movement_rows = []

    for product in products:
        movement_rows.append(
            {
                "product_id": product.id,
                "product_name": product.name,
                "movement_type": "RESTOCK",
                "quantity": product.stock,
                "created_at": to_storage_datetime(
                    opening_local - timedelta(hours=1),
                    tz_mode,
                ),
            }
        )

    # ---- Customers ------------------------------------------------
    customer_rows = build_customers(rng, customer_count)
    customers = []

    for index, row in enumerate(customer_rows):
        signup_offset = rng.randint(0, max(total_days - 20, 1))

        customer = Customer(
            name=row["name"],
            phone=row["phone"],
            email=row["email"],
            is_active=True,
            created_at=to_storage_datetime(
                opening_local + timedelta(days=signup_offset),
                tz_mode,
            ),
        )
        db.add(customer)
        customers.append(customer)

    db.flush()

    # Planted loyal cohort: first 14 customers get heavy weighting.
    loyal_count = min(14, len(customers))
    customer_weights = {}

    for index, customer in enumerate(customers):
        customer_weights[customer.id] = (
            6.0 if index < loyal_count else 1.0
        )

    loyal_ids = {
        customer.id
        for customer in customers[:loyal_count]
    }

    # ---- Orders ---------------------------------------------------
    stock_by_id = {
        product.id: product.stock
        for product in products
    }
    product_by_id = {
        product.id: product
        for product in products
    }

    # Let a few strong-but-not-top SKUs run dry near the end. Using
    # mid-tier movers keeps the top-products trend clean while still
    # producing a believable shortage.
    ranked_by_velocity = sorted(
        product_weights.items(),
        key=lambda pair: pair[1],
        reverse=True,
    )

    starved_ids = {
        product_id
        for product_id, _ in ranked_by_velocity[
            3:3 + LOW_STOCK_SKU_COUNT
        ]
    }

    starve_from = today_local - timedelta(
        days=LOW_STOCK_WINDOW_DAYS
    )

    orders_created = 0
    items_created = 0
    revenue_total = 0.0
    hour_counts = defaultdict(int)
    channel_counts = defaultdict(int)
    units_by_product = defaultdict(int)
    orders_by_customer = defaultdict(int)

    for offset in range(total_days):
        current_day = start_day + timedelta(days=offset)

        expected = (
            BASE_ORDERS_PER_DAY
            * day_multiplier(current_day, start_day, total_days)
        )
        order_count = max(
            0,
            int(rng.gauss(expected, expected * 0.22)),
        )

        online_share = online_share_for(
            current_day,
            start_day,
            total_days,
        )

        day_orders = []
        day_lines = []

        for _ in range(order_count):
            hour = weighted_choice(rng, HOUR_WEIGHTS)

            local_dt = datetime.combine(
                current_day,
                datetime.min.time(),
            ).replace(
                hour=hour,
                minute=rng.randint(0, 59),
                second=rng.randint(0, 59),
            )

            # Don't create orders in the future.
            if local_dt.date() == today_local:
                now_local = datetime.now()
                if local_dt > now_local:
                    continue

            is_online = rng.random() < online_share
            channel = "ONLINE" if is_online else "POS"

            payment_method = weighted_choice(
                rng,
                ONLINE_PAYMENTS if is_online else POS_PAYMENTS,
            )

            registered_share = (
                ONLINE_REGISTERED_SHARE
                if is_online
                else POS_REGISTERED_SHARE
            )

            customer_id = None

            if rng.random() < registered_share:
                customer_id = rng.choices(
                    list(customer_weights),
                    weights=list(customer_weights.values()),
                    k=1,
                )[0]

            # Basket
            distinct = rng.choices(
                [1, 2, 3, 4],
                weights=[0.32, 0.36, 0.22, 0.10],
                k=1,
            )[0]

            chosen_ids = set()
            attempts = 0

            while len(chosen_ids) < distinct and attempts < 20:
                attempts += 1
                picked = rng.choices(
                    list(product_weights),
                    weights=list(product_weights.values()),
                    k=1,
                )[0]

                if stock_by_id[picked] > 0:
                    chosen_ids.add(picked)

            if not chosen_ids:
                continue

            storage_dt = to_storage_datetime(local_dt, tz_mode)

            # Resolve the basket fully in memory first, so the order
            # row can be inserted with its final total. This lets a
            # whole day be flushed in one round trip instead of one
            # per order - the difference between seconds and half an
            # hour against a remote Supabase instance.
            pending_lines = []
            order_total = 0.0

            for product_id in chosen_ids:
                product = product_by_id[product_id]

                quantity = rng.choices(
                    [1, 2, 3],
                    weights=[0.68, 0.24, 0.08],
                    k=1,
                )[0]
                quantity = min(quantity, stock_by_id[product_id])

                if quantity <= 0:
                    continue

                line_total = round(product.price * quantity, 2)
                order_total += line_total

                pending_lines.append(
                    {
                        "product_id": product_id,
                        "product_name": product.name,
                        "quantity": quantity,
                        "unit_price": product.price,
                        "line_total": line_total,
                    }
                )

                stock_by_id[product_id] -= quantity
                units_by_product[product_id] += quantity
                items_created += 1

                movement_rows.append(
                    {
                        "product_id": product_id,
                        "product_name": product.name,
                        "movement_type": "SALE",
                        "quantity": -quantity,
                        "created_at": storage_dt,
                    }
                )

                # Restock when running low, unless this SKU is one of
                # the planted shortages inside the final window.
                starved = (
                    product_id in starved_ids
                    and current_day >= starve_from
                )

                if (
                    not starved
                    and stock_by_id[product_id] <= LOW_STOCK_TRIGGER
                ):
                    stock_by_id[product_id] += RESTOCK_BATCH

                    movement_rows.append(
                        {
                            "product_id": product_id,
                            "product_name": product.name,
                            "movement_type": "RESTOCK",
                            "quantity": RESTOCK_BATCH,
                            "created_at": storage_dt
                            + timedelta(minutes=30),
                        }
                    )

            if not pending_lines:
                continue

            order = Order(
                customer_id=customer_id,
                order_channel=channel,
                total_amount=round(order_total, 2),
                payment_method=payment_method,
                status="completed",
                created_at=storage_dt,
            )

            day_orders.append(order)
            day_lines.append(pending_lines)

            orders_created += 1
            revenue_total += order_total
            hour_counts[hour] += 1
            channel_counts[channel] += 1

            if customer_id is not None:
                orders_by_customer[customer_id] += 1

        # One flush per day assigns every order id in this batch.
        if day_orders:
            db.add_all(day_orders)
            db.flush()

            item_rows = []

            for order, lines in zip(day_orders, day_lines):
                for line in lines:
                    item_rows.append(
                        {
                            "order_id": order.id,
                            **line,
                        }
                    )

            if item_rows:
                db.bulk_insert_mappings(OrderItem, item_rows)

    # Persist final stock levels.
    for product in products:
        product.stock = stock_by_id[product.id]

    # Movements carry no foreign key back to orders, so they go in as
    # one chunked bulk insert at the end.
    for index in range(0, len(movement_rows), INSERT_CHUNK_SIZE):
        db.bulk_insert_mappings(
            InventoryMovement,
            movement_rows[index:index + INSERT_CHUNK_SIZE],
        )

    db.commit()

    loyal_orders = sum(
        count
        for customer_id, count in orders_by_customer.items()
        if customer_id in loyal_ids
    )

    return {
        "start_day": start_day,
        "end_day": today_local,
        "total_days": total_days,
        "orders": orders_created,
        "items": items_created,
        "movements": len(movement_rows),
        "revenue": revenue_total,
        "hour_counts": dict(hour_counts),
        "channel_counts": dict(channel_counts),
        "units_by_product": dict(units_by_product),
        "product_by_id": {
            product.id: product.name
            for product in products
        },
        "low_stock": [
            (product_by_id[product_id].name, stock_by_id[product_id])
            for product_id in sorted(
                stock_by_id,
                key=lambda key: stock_by_id[key],
            )
            if stock_by_id[product_id] <= 20
        ][:6],
        "customers": len(customers),
        "registered_orders": sum(orders_by_customer.values()),
        "loyal_orders": loyal_orders,
        "loyal_count": loyal_count,
    }


# =========================================================
# REPORT
# =========================================================

def print_report(stats: dict, tz_mode: str) -> None:
    line = "=" * 58

    print()
    print(line)
    print("SEED COMPLETE")
    print(line)
    print(f"Period        : {stats['start_day']} -> {stats['end_day']}")
    print(f"Days          : {stats['total_days']}")
    print(f"Orders        : {stats['orders']:,}")
    print(f"Order items   : {stats['items']:,}")
    print(f"Movements     : {stats['movements']:,}")
    print(f"Customers     : {stats['customers']:,}")
    print(f"Revenue       : PHP {stats['revenue']:,.2f}")
    print(f"Timestamp mode: {tz_mode}")

    print()
    print(line)
    print("PATTERN MANIFEST - verify your analytics finds these")
    print(line)

    print()
    print("1. Hour-of-day demand (Manila local)")

    hour_counts = stats["hour_counts"]
    peak = max(hour_counts.values()) if hour_counts else 1

    for hour in range(OPEN_HOUR, CLOSE_HOUR):
        count = hour_counts.get(hour, 0)
        bar = "#" * int((count / peak) * 40)
        flag = "  <-- planted lull" if hour in (14, 15, 16) else ""
        print(f"   {hour:02d}:00  {count:5,}  {bar}{flag}")

    print()
    print("2. Channel mix")

    channel_counts = stats["channel_counts"]
    total_channel = sum(channel_counts.values()) or 1

    for channel, count in sorted(channel_counts.items()):
        share = count / total_channel * 100
        print(f"   {channel:<7} {count:6,}  ({share:5.1f}%)")

    print(
        f"   ONLINE share was seeded to grow "
        f"{ONLINE_SHARE_START:.0%} -> {ONLINE_SHARE_END:.0%}"
    )

    print()
    print("3. Slowest-moving SKUs (should be the planted pair)")

    units = stats["units_by_product"]
    names = stats["product_by_id"]

    ranked = sorted(units.items(), key=lambda pair: pair[1])

    for product_id, quantity in ranked[:4]:
        print(f"   {names[product_id]:<28} {quantity:6,} units")

    print()
    print("4. Top-moving SKUs")

    for product_id, quantity in list(reversed(ranked))[:4]:
        print(f"   {names[product_id]:<28} {quantity:6,} units")

    print()
    print("5. Loyal cohort")
    print(
        f"   {stats['loyal_count']} seeded loyal customers account for "
        f"{stats['loyal_orders']:,} of "
        f"{stats['registered_orders']:,} registered orders"
    )

    print()
    print("6. Low stock at end of period")

    if stats["low_stock"]:
        for name, stock in stats["low_stock"]:
            print(f"   {name:<28} {stock:4,} left")
    else:
        print("   (none - every SKU stayed replenished)")

    print()
    print("7. Anomalies")
    print(
        f"   Promo spike : {PROMO_SPIKE_DAYS} days at "
        f"{PROMO_SPIKE_MULTIPLIER}x, ~{PROMO_SPIKE_AT:.0%} into period"
    )
    print(
        f"   Dead week   : {DEAD_WEEK_DAYS} days at "
        f"{DEAD_WEEK_MULTIPLIER}x, ~{DEAD_WEEK_AT:.0%} into period"
    )

    print()

    if tz_mode == "utc":
        print(line)
        print("TIMEZONE NOTE")
        print(line)
        print(
            "Timestamps are stored as naive UTC, matching the app's\n"
            "datetime.utcnow default. Because the dashboard compares\n"
            "them against date.today(), the hour-of-day curve above\n"
            "will appear shifted by 8 hours in the UI until the\n"
            "timezone handling is fixed. That mismatch is the point:\n"
            "the seeded lull is 2PM-4PM, so if your analytics reports\n"
            "6AM-8AM instead, you are looking at the bug."
        )
        print()


# =========================================================
# ENTRY POINT
# =========================================================

def describe_target() -> tuple[str, bool]:
    """Return a printable target description and whether it is local."""
    from app.core.settings import DATABASE_URL

    try:
        from sqlalchemy.engine import make_url

        url = make_url(DATABASE_URL)
    except Exception:
        return DATABASE_URL, False

    if url.drivername.startswith("sqlite"):
        return f"SQLite  {url.database}", True

    host = url.host or "?"
    is_local = host in {"localhost", "127.0.0.1", "::1"}

    return (
        f"{url.drivername}  {host}/{url.database}",
        is_local,
    )


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Seed OmniPOS Zero with dummy data."
    )
    parser.add_argument(
        "--months",
        type=int,
        default=DEFAULT_MONTHS,
        help=f"Months of history (default {DEFAULT_MONTHS}).",
    )
    parser.add_argument(
        "--customers",
        type=int,
        default=60,
        help="Number of customers to create (default 60).",
    )
    parser.add_argument(
        "--tz-mode",
        choices=["utc", "local"],
        default="utc",
        help="How to store timestamps (default utc).",
    )
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Delete existing products, customers, orders, and "
             "movements before seeding.",
    )

    parser.add_argument(
        "--force",
        action="store_true",
        help="Skip the confirmation prompt when resetting a remote "
             "database such as Supabase.",
    )

    args = parser.parse_args()

    target, is_local = describe_target()

    print(f"Target database: {target}")

    if args.reset and not is_local and not args.force:
        print()
        print(
            "This is a REMOTE database. --reset will permanently "
            "delete all\nproducts, customers, orders, order items, "
            "and inventory movements."
        )

        try:
            answer = input("Type 'seed' to continue: ").strip()
        except EOFError:
            print(
                "Aborted: no terminal to confirm on. "
                "Re-run with --force if you are sure."
            )
            return 1

        if answer != "seed":
            print("Aborted. Nothing was changed.")
            return 1

    db = SessionLocal()

    try:
        existing_orders = db.query(Order).count()
        existing_products = db.query(Product).count()

        if (existing_orders or existing_products) and not args.reset:
            print(
                "Database already contains data "
                f"({existing_products} products, "
                f"{existing_orders} orders).\n"
                "Re-run with --reset to wipe and reseed."
            )
            return 1

        if args.reset:
            print("Clearing existing data...")
            reset_tables(db)

        print(
            f"Seeding {args.months} months "
            f"({args.months * 30} days) of activity..."
        )

        stats = seed(
            db=db,
            months=args.months,
            tz_mode=args.tz_mode,
            customer_count=args.customers,
        )

        print_report(stats, args.tz_mode)

        return 0

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())