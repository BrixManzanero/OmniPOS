from pathlib import Path

from sqlalchemy import (
    create_engine,
    func,
    select,
    text,
)

from app.core.database import engine as supabase_engine
from app import models


# =========================
# SQLITE SOURCE
# =========================

BACKEND_DIR = Path(__file__).resolve().parent.parent
SQLITE_PATH = BACKEND_DIR / "omnipos.db"

sqlite_engine = create_engine(
    f"sqlite:///{SQLITE_PATH.as_posix()}",
    connect_args={
        "check_same_thread": False
    }
)


# =========================
# TABLE ORDER
# =========================
# Parents first, children after.
# This preserves foreign keys.

TABLES = [
    models.Product.__table__,
    models.Customer.__table__,
    models.Order.__table__,
    models.OrderItem.__table__,
    models.InventoryMovement.__table__,
]


def get_count(connection, table):
    return connection.execute(
        select(func.count()).select_from(table)
    ).scalar_one()


def migrate():
    if not SQLITE_PATH.exists():
        raise FileNotFoundError(
            f"SQLite source not found: {SQLITE_PATH}"
        )

    print()
    print("================================")
    print("OmniPOS SQLite -> Supabase")
    print("================================")
    print()

    # -------------------------
    # CHECK SOURCE
    # -------------------------

    with sqlite_engine.connect() as source:
        print("SQLite source records:")

        for table in TABLES:
            count = get_count(
                source,
                table
            )

            print(
                f"  {table.name}: {count}"
            )

    print()

    # -------------------------
    # MAKE SURE TARGET IS EMPTY
    # -------------------------

    with supabase_engine.connect() as target:
        print("Supabase existing records:")

        target_has_data = False

        for table in TABLES:
            count = get_count(
                target,
                table
            )

            print(
                f"  {table.name}: {count}"
            )

            if count > 0:
                target_has_data = True

    if target_has_data:
        print()
        print(
            "STOPPED: Supabase already contains data."
        )
        print(
            "Migration was not started to avoid duplicates."
        )
        return

    print()
    print("Starting migration...")
    print()

    # -------------------------
    # COPY DATA
    # -------------------------

    with sqlite_engine.connect() as source:
        with supabase_engine.begin() as target:

            for table in TABLES:

                rows = source.execute(
                    select(table)
                ).all()

                if not rows:
                    print(
                        f"{table.name}: no records"
                    )
                    continue

                records = [
                    dict(row._mapping)
                    for row in rows
                ]

                target.execute(
                    table.insert(),
                    records
                )

                print(
                    f"{table.name}: "
                    f"{len(records)} migrated"
                )

    # -------------------------
    # RESET POSTGRES ID SEQUENCES
    # -------------------------

    print()
    print("Resetting PostgreSQL ID sequences...")

    table_names = [
        "products",
        "customers",
        "orders",
        "order_items",
        "inventory_movements",
    ]

    with supabase_engine.begin() as connection:

        for table_name in table_names:

            connection.execute(
                text(
                    f"""
                    SELECT setval(
                        pg_get_serial_sequence(
                            '{table_name}',
                            'id'
                        ),
                        COALESCE(
                            (SELECT MAX(id)
                             FROM {table_name}),
                            1
                        ),
                        (
                            SELECT COUNT(*)
                            FROM {table_name}
                        ) > 0
                    )
                    """
                )
            )

    print("Sequences reset.")

    # -------------------------
    # FINAL VALIDATION
    # -------------------------

    print()
    print("Final Supabase record counts:")

    with supabase_engine.connect() as target:

        for table in TABLES:
            count = get_count(
                target,
                table
            )

            print(
                f"  {table.name}: {count}"
            )

    print()
    print("================================")
    print("Migration completed successfully.")
    print("================================")
    print()


if __name__ == "__main__":
    migrate()