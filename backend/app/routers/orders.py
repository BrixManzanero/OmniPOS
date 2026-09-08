from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload, selectinload

from .. import models, schemas
from ..core.database import get_db


router = APIRouter(
    prefix="/orders",
    tags=["Orders"],
)


# ==========================================================
# ORDER / PAYMENT RULES
# ==========================================================

ALLOWED_PAYMENTS_BY_CHANNEL = {
    "POS": {
        "cash",
        "gcash",
        "maya",
        "card",
    },
    "ONLINE": {
        "gcash",
        "maya",
        "card",
    },
}


def validate_payment_method(
    order_channel: str,
    payment_method: str,
) -> None:
    allowed_payments = ALLOWED_PAYMENTS_BY_CHANNEL.get(
        order_channel
    )

    if allowed_payments is None:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unsupported order channel: "
                f"{order_channel}."
            ),
        )

    if payment_method not in allowed_payments:
        raise HTTPException(
            status_code=400,
            detail=(
                f"{payment_method.upper()} is not "
                f"available for {order_channel} orders."
            ),
        )


# ==========================================================
# CHECKOUT
# ==========================================================

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
        # --------------------------------------------------
        # Validate channel + payment combination.
        #
        # POS:
        # - cash
        # - gcash
        # - maya
        # - card
        #
        # ONLINE:
        # - gcash
        # - maya
        # - card
        #
        # Customer registration is independent from
        # payment method and order channel.
        # --------------------------------------------------

        validate_payment_method(
            order_channel=checkout_data.order_channel,
            payment_method=checkout_data.payment_method,
        )

        # --------------------------------------------------
        # Validate optional registered customer.
        #
        # customer_id = None is valid for:
        # - POS walk-in customers
        # - ONLINE guest customers
        # --------------------------------------------------

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
                        f"Customer ID "
                        f"{checkout_data.customer_id} "
                        "not found."
                    ),
                )

            if not customer.is_active:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Customer "
                        f"{customer.name} "
                        "is inactive."
                    ),
                )

        # --------------------------------------------------
        # Aggregate duplicate products.
        #
        # Example:
        # Product 1 × 2
        # Product 1 × 3
        #
        # becomes:
        # Product 1 × 5
        #
        # This prevents duplicate cart rows from
        # bypassing stock validation.
        # --------------------------------------------------

        requested_quantities: dict[int, int] = defaultdict(int)

        for item in checkout_data.items:
            requested_quantities[
                item.product_id
            ] += item.quantity

        product_ids = list(
            requested_quantities
        )

        # Lock products while checkout is running so
        # concurrent orders cannot oversell stock.
        products = (
            db.query(models.Product)
            .filter(
                models.Product.id.in_(
                    product_ids
                )
            )
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
            if product_id
            not in products_by_id
        ]

        if missing_product_ids:
            raise HTTPException(
                status_code=404,
                detail=(
                    "Product ID(s) not found: "
                    + ", ".join(
                        str(product_id)
                        for product_id
                        in missing_product_ids
                    )
                ),
            )

        # --------------------------------------------------
        # Validate stock and prepare order items.
        # --------------------------------------------------

        prepared_items = []
        total_amount = 0.0

        for (
            product_id,
            quantity,
        ) in requested_quantities.items():

            product = products_by_id[
                product_id
            ]

            if not product.is_active:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"{product.name} "
                        "is not available."
                    ),
                )

            if product.stock < quantity:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Not enough stock for "
                        f"{product.name}. "
                        f"Available: "
                        f"{product.stock}"
                    ),
                )

            line_total = (
                product.price
                * quantity
            )

            total_amount += line_total

            prepared_items.append(
                {
                    "product": product,
                    "quantity": quantity,
                    "line_total": line_total,
                }
            )

        # --------------------------------------------------
        # Create order.
        #
        # Examples:
        #
        # POS walk-in + GCash
        # customer_id = None
        # order_channel = POS
        # payment_method = gcash
        #
        # ONLINE guest + Maya
        # customer_id = None
        # order_channel = ONLINE
        # payment_method = maya
        #
        # ONLINE registered + Card
        # customer_id = 10
        # order_channel = ONLINE
        # payment_method = card
        # --------------------------------------------------

        order = models.Order(
            customer_id=(
                checkout_data.customer_id
            ),
            order_channel=(
                checkout_data.order_channel
            ),
            total_amount=total_amount,
            payment_method=(
                checkout_data.payment_method
            ),
            status="completed",
        )

        db.add(order)
        db.flush()

        # --------------------------------------------------
        # Create order items and inventory movements.
        # --------------------------------------------------

        for prepared in prepared_items:
            product = prepared[
                "product"
            ]

            quantity = prepared[
                "quantity"
            ]

            line_total = prepared[
                "line_total"
            ]

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

        # --------------------------------------------------
        # Return fully loaded order.
        # --------------------------------------------------

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
                == order.id
            )
            .one()
        )

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise


# ==========================================================
# ORDER HISTORY
# ==========================================================

@router.get(
    "/",
    response_model=list[
        schemas.OrderResponse
    ],
)
def get_orders(
    db: Session = Depends(get_db),
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