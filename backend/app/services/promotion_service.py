from datetime import datetime

from sqlalchemy.orm import Session, joinedload

from .. import models, schemas


# =========================
# VALIDATION
# =========================

def validate_promotion(
    promotion: schemas.PromotionCreate,
    db: Session,
) -> None:
    """Raises ValueError when the promotion is invalid."""

    if not promotion.name.strip():
        raise ValueError(
            "Promotion name is required."
        )

    if (
        promotion.discount_type == "PERCENT"
        and promotion.discount_value > 100
    ):
        raise ValueError(
            "Percentage discount cannot exceed 100."
        )

    if (
        promotion.start_date
        and promotion.end_date
        and promotion.end_date <= promotion.start_date
    ):
        raise ValueError(
            "End date must be after the start date."
        )

    # Both set, or neither.
    hours = [
        promotion.start_hour,
        promotion.end_hour,
    ]

    if any(h is not None for h in hours) and None in hours:
        raise ValueError(
            "Both start hour and end hour are required "
            "when using a daily time window."
        )

    if promotion.target_type == "PRODUCT":
        if not promotion.target_product_id:
            raise ValueError(
                "A product is required for product promotions."
            )

        product = (
            db.query(models.Product)
            .filter(
                models.Product.id
                == promotion.target_product_id
            )
            .first()
        )

        if not product:
            raise ValueError(
                "Target product not found."
            )

    if promotion.target_type == "CATEGORY":
        if not (
            promotion.target_category
            and promotion.target_category.strip()
        ):
            raise ValueError(
                "A category is required for category promotions."
            )


# =========================
# LIVE CHECK
# =========================

def is_live(
    promotion: models.Promotion,
    now: datetime | None = None,
) -> bool:
    """ACTIVE, and inside both the date and hour window?"""

    now = now or datetime.utcnow()

    if promotion.status != "ACTIVE":
        return False

    if promotion.start_date and now < promotion.start_date:
        return False

    if promotion.end_date and now > promotion.end_date:
        return False

    if (
        promotion.start_hour is not None
        and promotion.end_hour is not None
    ):
        hour = now.hour

        # Normal window: 14-16
        if promotion.start_hour <= promotion.end_hour:
            if not (
                promotion.start_hour
                <= hour
                <= promotion.end_hour
            ):
                return False

        # Overnight window: 22-2
        else:
            if not (
                hour >= promotion.start_hour
                or hour <= promotion.end_hour
            ):
                return False

    return True


# =========================
# SERIALIZATION
# =========================

def to_response(
    promotion: models.Promotion,
) -> dict:
    return {
        "id": promotion.id,
        "name": promotion.name,
        "description": promotion.description,
        "discount_type": promotion.discount_type,
        "discount_value": promotion.discount_value,
        "target_type": promotion.target_type,
        "target_product_id": promotion.target_product_id,
        "target_product_name": (
            promotion.target_product.name
            if promotion.target_product
            else None
        ),
        "target_category": promotion.target_category,
        "channel": promotion.channel,
        "start_date": promotion.start_date,
        "end_date": promotion.end_date,
        "start_hour": promotion.start_hour,
        "end_hour": promotion.end_hour,
        "status": promotion.status,
        "source": promotion.source,
        "created_at": promotion.created_at,
        "is_live": is_live(promotion),
    }


# =========================
# QUERIES
# =========================

def list_promotions(
    db: Session,
    status: str | None = None,
) -> list[models.Promotion]:
    query = (
        db.query(models.Promotion)
        .options(
            joinedload(
                models.Promotion.target_product
            )
        )
    )

    if status:
        query = query.filter(
            models.Promotion.status == status
        )

    return (
        query
        .order_by(
            models.Promotion.created_at.desc()
        )
        .all()
    )


# =========================
# AUTO-EXPIRE
# =========================

def expire_finished_promotions(
    db: Session,
) -> int:
    """Marks ACTIVE promotions as EXPIRED once past end_date."""

    now = datetime.utcnow()

    expired = (
        db.query(models.Promotion)
        .filter(
            models.Promotion.status == "ACTIVE",
            models.Promotion.end_date.isnot(None),
            models.Promotion.end_date < now,
        )
        .all()
    )

    for promotion in expired:
        promotion.status = "EXPIRED"

    if expired:
        db.commit()

    return len(expired)
