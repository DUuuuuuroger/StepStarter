from fastapi import APIRouter, HTTPException

from backend.app.services.calendar_service import get_day_summary

router = APIRouter()


@router.get("/calendar/day")
def get_calendar_day_api(date: str) -> dict:
    if not date:
        raise HTTPException(status_code=400, detail="date is required")
    return get_day_summary(date)
