from sqlalchemy.orm import (
    Session,
    joinedload,
    selectinload,
)

from .. import models


def get_customer_by_id(
    db: Session,
    customer_id: int,
):
    return (
        db.query(models.Customer)
        .filter(
            models.Customer.id
            == customer_id
        )
        .first()
    )


def lock_products_by_ids(
    db: Session,
    product_ids: list[int],
):
    return (
        db.query(models.Product)
        .filter(
            models.Product.id.in_(
                product_ids
            )
        )
        .with_for_update()
        .all()
    )


def create_order(
    db: Session,
    *,
    customer_id: int | None,
    order_channel: str,
    total_amount: float,
    payment_method: str,
):
    order = models.Order(
        customer_id=customer_id,
        order_channel=order_channel,
        total_amount=total_amount,
        payment_method=payment_method,
        status="completed",
    )

    db.add(order)
    db.flush()

    return order


def create_order_item(
    db: Session,
    *,
    order_id: int,
    product: models.Product,
    quantity: int,
    line_total: float,
):
    order_item = models.OrderItem(
        order_id=order_id,
        product_id=product.id,
        product_name=product.name,
        quantity=quantity,
        unit_price=product.price,
        line_total=line_total,
    )

    db.add(order_item)

    return order_item


def create_inventory_movement(
    db: Session,
    *,
    product: models.Product,
    quantity: int,
):
    movement = models.InventoryMovement(
        product_id=product.id,
        product_name=product.name,
        movement_type="SALE",
        quantity=-quantity,
    )

    db.add(movement)

    return movement


def get_order_by_id(
    db: Session,
    order_id: int,
):
    return (
        db.query(models.Order)
        .options(
            joinedload(
                models.Order.customer
            ),
            selectinload(
                models.Order.items
            ),
        )
        .filter(
            models.Order.id
            == order_id
        )
        .one()
    )


def get_all_orders(
    db: Session,
):
    return (
        db.query(models.Order)
        .options(
            joinedload(
                models.Order.customer
            ),
            selectinload(
                models.Order.items
            ),
        )
        .order_by(
            models.Order.created_at.desc()
        )
        .all()
    )