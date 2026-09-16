from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..core.database import get_db


router = APIRouter(
    prefix="/products",
    tags=["Products"],
)


@router.post(
    "/",
    response_model=schemas.ProductResponse,
)
def create_product(
    product: schemas.ProductCreate,
    db: Session = Depends(get_db),
):
    name = product.name.strip()
    sku = product.sku.strip().upper()
    category = (
        product.category.strip()
        if product.category and product.category.strip()
        else None
    )

    if not name:
        raise HTTPException(
            status_code=400,
            detail="Product name is required.",
        )

    if not sku:
        raise HTTPException(
            status_code=400,
            detail="SKU is required.",
        )

    existing_product = (
        db.query(models.Product)
        .filter(models.Product.sku == sku)
        .first()
    )

    if existing_product:
        raise HTTPException(
            status_code=400,
            detail="SKU already exists.",
        )

    new_product = models.Product(
        name=name,
        sku=sku,
        category=category,
        price=product.price,
        stock=product.stock,
    )

    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    return new_product


@router.get(
    "/",
    response_model=list[schemas.ProductResponse],
)
def get_products(
    db: Session = Depends(get_db),
):
    return (
        db.query(models.Product)
        .order_by(models.Product.name.asc())
        .all()
    )
