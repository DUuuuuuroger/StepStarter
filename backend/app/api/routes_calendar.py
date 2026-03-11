from fastapi import APIRouter, HTTPException

from backend.app.services.calendar_service import get_day_summary
from backend.app.data.repo import get_calendar_month

router = APIRouter()


@router.get("/calendar/day")
def get_calendar_day_api(date: str) -> dict:
    if not date:
        raise HTTPException(status_code=400, detail="date is required")
    return get_day_summary(date)


@router.get("/calendar/month")
def get_calendar_month_api(year: int, month: int) -> dict:
    return get_calendar_month(year, month)
