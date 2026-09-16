from collections import defaultdict

from sqlalchemy.orm import Session

from .. import schemas
from ..repositories.order_repository import (
    create_inventory_movement,
    create_order,
    create_order_item,
    get_all_orders,
    get_customer_by_id,
    get_order_by_id,
    lock_products_by_ids,
)


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


class OrderServiceError(Exception):
    def __init__(
        self,
        status_code: int,
        detail: str,
    ):
        self.status_code = status_code
        self.detail = detail
        super().__init__(detail)


def validate_payment_method(
    order_channel: str,
    payment_method: str,
) -> None:
    allowed_payments = (
        ALLOWED_PAYMENTS_BY_CHANNEL.get(
            order_channel
        )
    )

    if allowed_payments is None:
        raise OrderServiceError(
            status_code=400,
            detail=(
                f"Unsupported order channel: "
                f"{order_channel}."
            ),
        )

    if payment_method not in allowed_payments:
        raise OrderServiceError(
            status_code=400,
            detail=(
                f"{payment_method.upper()} is not "
                f"available for {order_channel} orders."
            ),
        )


def validate_customer(
    db: Session,
    customer_id: int | None,
) -> None:
    if customer_id is None:
        return

    customer = get_customer_by_id(
        db,
        customer_id,
    )

    if customer is None:
        raise OrderServiceError(
            status_code=404,
            detail=(
                f"Customer ID {customer_id} "
                "not found."
            ),
        )

    if not customer.is_active:
        raise OrderServiceError(
            status_code=400,
            detail=(
                f"Customer {customer.name} "
                "is inactive."
            ),
        )


def aggregate_requested_quantities(
    items,
) -> dict[int, int]:
    requested_quantities: dict[int, int] = (
        defaultdict(int)
    )

    for item in items:
        requested_quantities[
            item.product_id
        ] += item.quantity

    return dict(requested_quantities)


def prepare_order_items(
    db: Session,
    requested_quantities: dict[int, int],
):
    product_ids = list(
        requested_quantities
    )

    products = lock_products_by_ids(
        db,
        product_ids,
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
        raise OrderServiceError(
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

    prepared_items = []
    total_amount = 0.0

    for (
        product_id,
        quantity,
    ) in requested_quantities.items():
        product = products_by_id[
            product_id
        ]

        if quantity <= 0:
            raise OrderServiceError(
                status_code=400,
                detail=(
                    f"Invalid quantity for "
                    f"{product.name}."
                ),
            )

        if not product.is_active:
            raise OrderServiceError(
                status_code=400,
                detail=(
                    f"{product.name} "
                    "is not available."
                ),
            )

        if product.stock < quantity:
            raise OrderServiceError(
                status_code=400,
                detail=(
                    f"Not enough stock for "
                    f"{product.name}. "
                    f"Available: {product.stock}"
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

    return (
        prepared_items,
        total_amount,
    )


def checkout_order(
    db: Session,
    checkout_data: schemas.CheckoutRequest,
):
    if not checkout_data.items:
        raise OrderServiceError(
            status_code=400,
            detail="Cart is empty.",
        )

    try:
        validate_payment_method(
            order_channel=(
                checkout_data.order_channel
            ),
            payment_method=(
                checkout_data.payment_method
            ),
        )

        validate_customer(
            db=db,
            customer_id=(
                checkout_data.customer_id
            ),
        )

        requested_quantities = (
            aggregate_requested_quantities(
                checkout_data.items
            )
        )

        (
            prepared_items,
            total_amount,
        ) = prepare_order_items(
            db,
            requested_quantities,
        )

        order = create_order(
            db,
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
        )

        for prepared in prepared_items:
            product = prepared["product"]
            quantity = prepared["quantity"]
            line_total = prepared["line_total"]

            create_order_item(
                db,
                order_id=order.id,
                product=product,
                quantity=quantity,
                line_total=line_total,
            )

            product.stock -= quantity

            create_inventory_movement(
                db,
                product=product,
                quantity=quantity,
            )

        db.commit()

        return get_order_by_id(
            db,
            order.id,
        )

    except OrderServiceError:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise


def list_orders(
    db: Session,
):
    return get_all_orders(
        db
    )