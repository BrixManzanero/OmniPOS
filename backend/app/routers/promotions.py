from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..core.database import get_db
from ..services import promotion_service


router = APIRouter(
    prefix="/promotions",
    tags=["Promotions"],
)


@router.get(
    "/",
    response_model=list[schemas.PromotionResponse],
)
def get_promotions(
    status: str | None = None,
    db: Session = Depends(get_db),
):
    promotion_service.expire_finished_promotions(db)

    promotions = promotion_service.list_promotions(
        db,
        status=status,
    )

    return [
        promotion_service.to_response(promotion)
        for promotion in promotions
    ]


@router.post(
    "/",
    response_model=schemas.PromotionResponse,
)
def create_promotion(
    promotion: schemas.PromotionCreate,
    db: Session = Depends(get_db),
):
    try:
        promotion_service.validate_promotion(
            promotion,
            db,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error

    new_promotion = models.Promotion(
        name=promotion.name.strip(),

        description=(
            promotion.description.strip()
            if promotion.description
            else None
        ),

        discount_type=promotion.discount_type,
        discount_value=promotion.discount_value,

        target_type=promotion.target_type,

        target_product_id=(
            promotion.target_product_id
            if promotion.target_type == "PRODUCT"
            else None
        ),

        target_category=(
            promotion.target_category.strip()
            if promotion.target_type == "CATEGORY"
            and promotion.target_category
            else None
        ),

        channel=promotion.channel,

        start_date=promotion.start_date,
        end_date=promotion.end_date,
        start_hour=promotion.start_hour,
        end_hour=promotion.end_hour,

        status=promotion.status,
        source=promotion.source,
    )

    db.add(new_promotion)
    db.commit()
    db.refresh(new_promotion)

    return promotion_service.to_response(
        new_promotion
    )


@router.patch(
    "/{promotion_id}/status",
    response_model=schemas.PromotionResponse,
)
def update_promotion_status(
    promotion_id: int,
    payload: schemas.PromotionStatusUpdate,
    db: Session = Depends(get_db),
):
    promotion = (
        db.query(models.Promotion)
        .filter(
            models.Promotion.id == promotion_id
        )
        .first()
    )

    if not promotion:
        raise HTTPException(
            status_code=404,
            detail="Promotion not found.",
        )

    promotion.status = payload.status

    db.commit()
    db.refresh(promotion)

    return promotion_service.to_response(
        promotion
    )


@router.delete(
    "/{promotion_id}",
    status_code=204,
)
def delete_promotion(
    promotion_id: int,
    db: Session = Depends(get_db),
):
    promotion = (
        db.query(models.Promotion)
        .filter(
            models.Promotion.id == promotion_id
        )
        .first()
    )

    if not promotion:
        raise HTTPException(
            status_code=404,
            detail="Promotion not found.",
        )

    db.delete(promotion)
    db.commit()
