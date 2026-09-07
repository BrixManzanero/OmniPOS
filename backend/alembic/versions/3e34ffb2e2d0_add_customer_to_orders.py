"""add customer to orders

Revision ID: 3e34ffb2e2d0
Revises: 3980241820e2
Create Date: 2026-09-04 17:50:38.642935
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.

revision: str = "3e34ffb2e2d0"
down_revision: Union[str, Sequence[str], None] = "3980241820e2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    # Add customer_id column to orders.
    # Nullable so existing and walk-in orders can remain without a customer.
    op.add_column(
        "orders",
        sa.Column(
            "customer_id",
            sa.Integer(),
            nullable=True
        )
    )

    # Add index for faster customer-order queries.
    op.create_index(
        op.f("ix_orders_customer_id"),
        "orders",
        ["customer_id"],
        unique=False
    )

    # Link orders.customer_id to customers.id.
    op.create_foreign_key(
        "fk_orders_customer_id_customers",
        "orders",
        "customers",
        ["customer_id"],
        ["id"]
    )


def downgrade() -> None:
    """Downgrade schema."""

    # Remove foreign key first.
    op.drop_constraint(
        "fk_orders_customer_id_customers",
        "orders",
        type_="foreignkey"
    )

    # Remove index.
    op.drop_index(
        op.f("ix_orders_customer_id"),
        table_name="orders"
    )

    # Remove customer_id column.
    op.drop_column(
        "orders",
        "customer_id"
    )