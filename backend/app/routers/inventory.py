from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)
from sqlalchemy.orm import Session

from ..core.database import get_db
from .. import models, schemas


router = APIRouter(
    prefix="/inventory",
    tags=["Inventory"]
)


# =========================
# GET INVENTORY
# =========================

@router.get(
    "/",
    response_model=list[schemas.ProductResponse]
)
def get_inventory(
    db: Session = Depends(get_db)
):
    products = (
        db.query(models.Product)
        .filter(
            models.Product.is_active == True
        )
        .order_by(
            models.Product.stock.asc(),
            models.Product.name.asc()
        )
        .all()
    )

    return products


# =========================
# GET INVENTORY MOVEMENTS
# =========================

@router.get(
    "/movements",
    response_model=list[
        schemas.InventoryMovementResponse
    ]
)
def get_inventory_movements(
    db: Session = Depends(get_db)
):
    movements = (
        db.query(
            models.InventoryMovement
        )
        .order_by(
            models.InventoryMovement.created_at.desc()
        )
        .all()
    )

    return movements


# =========================
# RESTOCK PRODUCT
# =========================

@router.post(
    "/restock",
    response_model=schemas.ProductResponse
)
def restock_product(
    restock: schemas.RestockRequest,
    db: Session = Depends(get_db)
):
    product = (
        db.query(models.Product)
        .filter(
            models.Product.id
            == restock.product_id
        )
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    if restock.quantity <= 0:
        raise HTTPException(
            status_code=400,
            detail=(
                "Restock quantity must "
                "be greater than zero"
            )
        )

    try:
        product.stock += restock.quantity

        movement = models.InventoryMovement(
            product_id=product.id,
            product_name=product.name,
            movement_type="RESTOCK",
            quantity=restock.quantity,
        )

        db.add(movement)

        db.commit()
        db.refresh(product)

        return product

    except Exception:
        db.rollback()
        raise