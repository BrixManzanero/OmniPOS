"""add order channel

Revision ID: 9e1026595bdc
Revises: 3e34ffb2e2d0
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
    op.add_column(
        "orders",
        sa.Column(
            "order_channel",
            sa.String(),
            nullable=False,
            server_default="POS"
        )
    )

    # Remove the database default afterward.
    # The application will decide POS or ONLINE.
    op.alter_column(
        "orders",
        "order_channel",
        server_default=None
    )


def downgrade() -> None:
    """Remove order channel."""

    op.drop_column(
        "orders",
        "order_channel"
    )