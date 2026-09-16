"""add order channel

Revision ID: 9e1026595bdc
Revises: 3e34ffb2e2d0

Uses batch_alter_table so this runs on SQLite as well as
PostgreSQL. SQLite has no ALTER COLUMN, which the original
server_default removal relied on.
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.

revision: str = "9e1026595bdc"
down_revision: Union[str, Sequence[str], None] = "3e34ffb2e2d0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add order channel to orders."""

    # Add the column and automatically assign
    # existing orders as POS orders.
    with op.batch_alter_table(
        "orders",
        schema=None,
    ) as batch_op:

        batch_op.add_column(
            sa.Column(
                "order_channel",
                sa.String(),
                nullable=False,
                server_default="POS",
            )
        )

    # Remove the database default afterward.
    # The application decides POS or ONLINE.
    with op.batch_alter_table(
        "orders",
        schema=None,
    ) as batch_op:

        batch_op.alter_column(
            "order_channel",
            existing_type=sa.String(),
            existing_nullable=False,
            server_default=None,
        )


def downgrade() -> None:
    """Remove order channel."""

    with op.batch_alter_table(
        "orders",
        schema=None,
    ) as batch_op:

        batch_op.drop_column("order_channel")