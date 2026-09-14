"""add customer to orders

Revision ID: 3e34ffb2e2d0
Revises: 3980241820e2
Create Date: 2026-09-04 17:50:38.642935

Uses batch_alter_table so this runs on SQLite as well as
PostgreSQL. SQLite cannot ALTER a constraint onto an existing
table; batch mode works around that by rebuilding the table,
and on PostgreSQL it emits the same plain ALTER statements as
before.
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
    # Nullable so existing and walk-in orders
    # can remain without a customer.
    with op.batch_alter_table(
        "orders",
        schema=None,
    ) as batch_op:

        batch_op.add_column(
            sa.Column(
                "customer_id",
                sa.Integer(),
                nullable=True,
            )
        )

        # Index for faster customer-order queries.
        batch_op.create_index(
            batch_op.f("ix_orders_customer_id"),
            ["customer_id"],
            unique=False,
        )

        # Link orders.customer_id to customers.id.
        batch_op.create_foreign_key(
            "fk_orders_customer_id_customers",
            "customers",
            ["customer_id"],
            ["id"],
        )


def downgrade() -> None:
    """Downgrade schema."""

    with op.batch_alter_table(
        "orders",
        schema=None,
    ) as batch_op:

        batch_op.drop_constraint(
            "fk_orders_customer_id_customers",
            type_="foreignkey",
        )

        batch_op.drop_index(
            batch_op.f("ix_orders_customer_id")
        )

        batch_op.drop_column("customer_id")