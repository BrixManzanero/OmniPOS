from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload, selectinload

from .. import models, schemas
from ..core.database import get_db


router = APIRouter(
    prefix="/customers",
    tags=["Customers"],
)


@router.get(
    "/",
    response_model=list[schemas.CustomerResponse],
)
def get_customers(
    db: Session = Depends(get_db),
):
    return (
        db.query(models.Customer)
        .filter(models.Customer.is_active.is_(True))
        .order_by(models.Customer.created_at.desc())
        .all()
    )


@router.post(
    "/",
    response_model=schemas.CustomerResponse,
)
def create_customer(
    customer_data: schemas.CustomerCreate,
    db: Session = Depends(get_db),
):
    name = customer_data.name.strip()
    phone = (
        customer_data.phone.strip()
        if customer_data.phone and customer_data.phone.strip()
        else None
    )
    email = (
        customer_data.email.strip().lower()
        if customer_data.email and customer_data.email.strip()
        else None
    )

    if not name:
        raise HTTPException(
            status_code=400,
            detail="Customer name is required.",
        )

    if phone:
        existing_phone = (
            db.query(models.Customer)
            .filter(models.Customer.phone == phone)
            .first()
        )

        if existing_phone:
            raise HTTPException(
                status_code=400,
                detail=(
                    "A customer with this phone number "
                    "already exists."
                ),
            )

    if email:
        existing_email = (
            db.query(models.Customer)
            .filter(
                func.lower(models.Customer.email) == email
            )
            .first()
        )

        if existing_email:
            raise HTTPException(
                status_code=400,
                detail=(
                    "A customer with this email "
                    "already exists."
                ),
            )

    customer = models.Customer(
        name=name,
        phone=phone,
        email=email,
    )

    db.add(customer)
    db.commit()
    db.refresh(customer)

    return customer


@router.get(
    "/{customer_id}/history",
    response_model=schemas.CustomerHistoryResponse,
)
def get_customer_history(
    customer_id: int,
    db: Session = Depends(get_db),
):
    customer = (
        db.query(models.Customer)
        .filter(models.Customer.id == customer_id)
        .first()
    )

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found.",
        )

    orders = (
        db.query(models.Order)
        .options(
            joinedload(models.Order.customer),
            selectinload(models.Order.items),
        )
        .filter(
            models.Order.customer_id == customer_id,
            models.Order.status == "completed",
        )
        .order_by(models.Order.created_at.desc())
        .all()
    )

    total_orders = len(orders)
    total_spent = sum(
        float(order.total_amount)
        for order in orders
    )
    average_order_value = (
        total_spent / total_orders
        if total_orders > 0
        else 0.0
    )

    first_purchase = (
        min(order.created_at for order in orders)
        if orders
        else None
    )
    last_purchase = (
        max(order.created_at for order in orders)
        if orders
        else None
    )

    pos_orders = sum(
        1
        for order in orders
        if order.order_channel == "POS"
    )
    online_orders = sum(
        1
        for order in orders
        if order.order_channel == "ONLINE"
    )

    return {
        "customer": customer,
        "summary": {
            "total_orders": total_orders,
            "total_spent": round(total_spent, 2),
            "average_order_value": round(
                average_order_value,
                2,
            ),
            "first_purchase": first_purchase,
            "last_purchase": last_purchase,
            "pos_orders": pos_orders,
            "online_orders": online_orders,
            "returning_customer": total_orders >= 2,
        },
        "orders": orders,
    }
