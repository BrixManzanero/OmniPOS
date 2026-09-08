from datetime import date

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..services.analytics_service import (
    AnalyticsPeriod,
    get_analytics_overview,
    get_dashboard_analytics,
)


router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"],
)


@router.get("/dashboard")
def dashboard_analytics(
    db: Session = Depends(get_db),
):
    return get_dashboard_analytics(
        db
    )


@router.get("/overview")
def analytics_overview(
    period: AnalyticsPeriod = "7d",
    start_date: date | None = None,
    end_date: date | None = None,
    db: Session = Depends(get_db),
):
    try:
        return get_analytics_overview(
            db=db,
            period=period,
            start_date=start_date,
            end_date=end_date,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error