from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import schemas
from ..core.database import get_db
from ..services import insights_service


router = APIRouter(
    prefix="/insights",
    tags=["AI Insights"],
)


@router.get(
    "/",
    response_model=schemas.InsightsResponse,
)
def get_insights(
    db: Session = Depends(get_db),
):
    """Business recommendations derived from recent activity.

    Every suggestion comes back as a DRAFT promotion payload.
    Nothing is applied until the merchant approves it from
    the Promotions page.
    """

    return insights_service.get_insights(db)
