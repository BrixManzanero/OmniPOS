from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.orm import relationship

from .core.database import Base


# =========================
# PRODUCTS
# =========================

class Product(Base):
    __tablename__ = "products"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String,
        nullable=False
    )

    sku = Column(
        String,
        unique=True,
        index=True,
        nullable=False
    )

    category = Column(
        String,
        nullable=True
    )

    price = Column(
        Float,
        nullable=False
    )

    stock = Column(
        Integer,
        default=0
    )

    is_active = Column(
        Boolean,
        default=True
    )


# =========================
# ORDERS
# =========================

class Order(Base):
    __tablename__ = "orders"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    # Registered customer.
    # NULL means walk-in / guest customer.
    customer_id = Column(
        Integer,
        ForeignKey("customers.id"),
        nullable=True,
        index=True
    )

    # Where the order came from.
    # POS = physical store
    # ONLINE = online store
    order_channel = Column(
        String,
        nullable=False,
        default="POS"
    )

    total_amount = Column(
        Float,
        nullable=False
    )

    payment_method = Column(
        String,
        nullable=False
    )

    status = Column(
        String,
        default="completed"
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    items = relationship(
        "OrderItem",
        back_populates="order",
        cascade="all, delete-orphan"
    )

    customer = relationship(
        "Customer",
        back_populates="orders"
    )


# =========================
# ORDER ITEMS
# =========================

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    order_id = Column(
        Integer,
        ForeignKey("orders.id"),
        nullable=False
    )

    product_id = Column(
        Integer,
        ForeignKey("products.id"),
        nullable=False
    )

    product_name = Column(
        String,
        nullable=False
    )

    quantity = Column(
        Integer,
        nullable=False
    )

    unit_price = Column(
        Float,
        nullable=False
    )

    line_total = Column(
        Float,
        nullable=False
    )

    order = relationship(
        "Order",
        back_populates="items"
    )


# =========================
# INVENTORY MOVEMENTS
# =========================

class InventoryMovement(Base):
    __tablename__ = "inventory_movements"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    product_id = Column(
        Integer,
        ForeignKey("products.id"),
        nullable=False
    )

    product_name = Column(
        String,
        nullable=False
    )

    movement_type = Column(
        String,
        nullable=False
    )

    quantity = Column(
        Integer,
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )


# =========================
# CUSTOMERS
# =========================

class Customer(Base):
    __tablename__ = "customers"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String,
        nullable=False
    )

    phone = Column(
        String,
        nullable=True
    )

    email = Column(
        String,
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    is_active = Column(
        Boolean,
        default=True
    )

    orders = relationship(
        "Order",
        back_populates="customer"
    )