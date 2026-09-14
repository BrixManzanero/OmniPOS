"""baseline existing schema

Revision ID: 3980241820e2
Revises:
Create Date: 2026-09-04 17:43:57.516954

This baseline creates the schema as it stood before the
customer_id and order_channel migrations that follow it.

It was originally a stamp-only revision, written against a
database whose tables already existed. That left the project
unable to bootstrap a brand new database: the next revision
would try to ALTER a table that had never been created, and
`alembic upgrade head` failed on any fresh checkout.

Every create is guarded by an inspector check, so running
this against a database that already has the tables - the
original case this revision was written for - is still a
no-op.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3980241820e2'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _existing_tables() -> set[str]:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    return set(inspector.get_table_names())


def upgrade() -> None:
    """Upgrade schema."""

    tables = _existing_tables()

    # =========================
    # PRODUCTS
    # =========================

    if "products" not in tables:
        op.create_table(
            "products",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("name", sa.String(), nullable=False),
            sa.Column("sku", sa.String(), nullable=False),
            sa.Column("category", sa.String(), nullable=True),
            sa.Column("price", sa.Float(), nullable=False),
            sa.Column("stock", sa.Integer(), nullable=True),
            sa.Column("is_active", sa.Boolean(), nullable=True),
            sa.PrimaryKeyConstraint("id"),
        )

        op.create_index(
            op.f("ix_products_id"),
            "products",
            ["id"],
            unique=False,
        )

        op.create_index(
            op.f("ix_products_sku"),
            "products",
            ["sku"],
            unique=True,
        )

    # =========================
    # CUSTOMERS
    # =========================

    if "customers" not in tables:
        op.create_table(
            "customers",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("name", sa.String(), nullable=False),
            sa.Column("phone", sa.String(), nullable=True),
            sa.Column("email", sa.String(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.Column("is_active", sa.Boolean(), nullable=True),
            sa.PrimaryKeyConstraint("id"),
        )

        op.create_index(
            op.f("ix_customers_id"),
            "customers",
            ["id"],
            unique=False,
        )

    # =========================
    # ORDERS
    #
    # customer_id and order_channel are
    # deliberately absent - the two
    # revisions after this one add them.
    # =========================

    if "orders" not in tables:
        op.create_table(
            "orders",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("total_amount", sa.Float(), nullable=False),
            sa.Column("payment_method", sa.String(), nullable=False),
            sa.Column("status", sa.String(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.PrimaryKeyConstraint("id"),
        )

        op.create_index(
            op.f("ix_orders_id"),
            "orders",
            ["id"],
            unique=False,
        )

    # =========================
    # ORDER ITEMS
    # =========================

    if "order_items" not in tables:
        op.create_table(
            "order_items",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("order_id", sa.Integer(), nullable=False),
            sa.Column("product_id", sa.Integer(), nullable=False),
            sa.Column("product_name", sa.String(), nullable=False),
            sa.Column("quantity", sa.Integer(), nullable=False),
            sa.Column("unit_price", sa.Float(), nullable=False),
            sa.Column("line_total", sa.Float(), nullable=False),
            sa.ForeignKeyConstraint(["order_id"], ["orders.id"]),
            sa.ForeignKeyConstraint(["product_id"], ["products.id"]),
            sa.PrimaryKeyConstraint("id"),
        )

        op.create_index(
            op.f("ix_order_items_id"),
            "order_items",
            ["id"],
            unique=False,
        )

    # =========================
    # INVENTORY MOVEMENTS
    # =========================

    if "inventory_movements" not in tables:
        op.create_table(
            "inventory_movements",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("product_id", sa.Integer(), nullable=False),
            sa.Column("product_name", sa.String(), nullable=False),
            sa.Column("movement_type", sa.String(), nullable=False),
            sa.Column("quantity", sa.Integer(), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(["product_id"], ["products.id"]),
            sa.PrimaryKeyConstraint("id"),
        )

        op.create_index(
            op.f("ix_inventory_movements_id"),
            "inventory_movements",
            ["id"],
            unique=False,
        )


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_table("inventory_movements")
    op.drop_table("order_items")
    op.drop_table("orders")
    op.drop_table("customers")
    op.drop_table("products")