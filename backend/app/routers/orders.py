from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)
from sqlalchemy.orm import Session

from .. import schemas
from ..core.database import get_db
from ..services.order_service import (
    OrderServiceError,
    checkout_order,
    list_orders,
)


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
    try:
        return checkout_order(
            db=db,
            checkout_data=checkout_data,
        )

    except OrderServiceError as error:
        raise HTTPException(
            status_code=error.status_code,
            detail=error.detail,
        ) from error


@router.get(
    "/",
    response_model=list[
        schemas.OrderResponse
    ],
)
def get_orders(
    db: Session = Depends(get_db),
):
    return list_orders(db)