from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload, selectinload

from .. import models, schemas
from ..core.database import get_db


router = APIRouter(
    prefix="/orders",
    tags=["Orders"],
)


@router.post(
    "/checkout",
    response_model=schemas.OrderResponse,
)
def checkout(
    checkout_data: schemas.CheckoutRequest,
    db: Session = Depends(get_db),
):
    if not checkout_data.items:
        raise HTTPException(
            status_code=400,
            detail="Cart is empty.",
        )

    try:
        # Validate an optional registered customer.
        if checkout_data.customer_id is not None:
            customer = (
                db.query(models.Customer)
                .filter(
                    models.Customer.id
                    == checkout_data.customer_id
                )
                .first()
            )

            if not customer:
                raise HTTPException(
                    status_code=404,
                    detail=(
                        f"Customer ID {checkout_data.customer_id} "
                        "not found."
                    ),
                )

            if not customer.is_active:
                raise HTTPException(
                    status_code=400,
                    detail=f"Customer {customer.name} is inactive.",
                )

        # Aggregate duplicate product IDs before stock validation.
        # This prevents duplicate cart rows from overselling stock.
        requested_quantities: dict[int, int] = defaultdict(int)
        for item in checkout_data.items:
            requested_quantities[item.product_id] += item.quantity

        product_ids = list(requested_quantities)

        products = (
            db.query(models.Product)
            .filter(models.Product.id.in_(product_ids))
            .with_for_update()
            .all()
        )

        products_by_id = {
            product.id: product
            for product in products
        }

        missing_product_ids = [
            product_id
            for product_id in product_ids
            if product_id not in products_by_id
        ]

        if missing_product_ids:
            raise HTTPException(
                status_code=404,
                detail=(
                    "Product ID(s) not found: "
                    + ", ".join(
                        str(product_id)
                        for product_id in missing_product_ids
                    )
                ),
            )

        prepared_items = []
        total_amount = 0.0

        for product_id, quantity in requested_quantities.items():
            product = products_by_id[product_id]

            if not product.is_active:
                raise HTTPException(
                    status_code=400,
                    detail=f"{product.name} is not available.",
                )

            if product.stock < quantity:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Not enough stock for {product.name}. "
                        f"Available: {product.stock}"
                    ),
                )

            line_total = product.price * quantity
            total_amount += line_total

            prepared_items.append(
                {
                    "product": product,
                    "quantity": quantity,
                    "line_total": line_total,
                }
            )

        order = models.Order(
            customer_id=checkout_data.customer_id,
            order_channel=checkout_data.order_channel,
            total_amount=total_amount,
            payment_method=checkout_data.payment_method,
            status="completed",
        )

        db.add(order)
        db.flush()

        for prepared in prepared_items:
            product = prepared["product"]
            quantity = prepared["quantity"]
            line_total = prepared["line_total"]

            db.add(
                models.OrderItem(
                    order_id=order.id,
                    product_id=product.id,
                    product_name=product.name,
                    quantity=quantity,
                    unit_price=product.price,
                    line_total=line_total,
                )
            )

            product.stock -= quantity

            db.add(
                models.InventoryMovement(
                    product_id=product.id,
                    product_name=product.name,
                    movement_type="SALE",
                    quantity=-quantity,
                )
            )

        db.commit()

        return (
            db.query(models.Order)
            .options(
                joinedload(models.Order.customer),
                selectinload(models.Order.items),
            )
            .filter(models.Order.id == order.id)
            .one()
        )

    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise


@router.get(
    "/",
    response_model=list[schemas.OrderResponse],
)
def get_orders(
    db: Session = Depends(get_db),
):
    return (
        db.query(models.Order)
        .options(
            joinedload(models.Order.customer),
            selectinload(models.Order.items),
        )
        .order_by(models.Order.created_at.desc())
        .all()
    )
