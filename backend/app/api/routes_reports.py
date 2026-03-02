from fastapi import APIRouter, HTTPException

from backend.app.services.report_service import build_report, get_or_generate_reports, refresh_reports

router = APIRouter()


@router.get("/reports/weekly")
def get_weekly_report(week: str) -> dict:
    if not week:
        raise HTTPException(status_code=400, detail="week is required")
    return build_report("weekly", week)


@router.get("/reports/monthly")
def get_monthly_report(month: str) -> dict:
    if not month:
        raise HTTPException(status_code=400, detail="month is required")
    return build_report("monthly", month)


@router.get("/reports/yearly")
def get_yearly_report(year: str) -> dict:
    if not year:
        raise HTTPException(status_code=400, detail="year is required")
    return build_report("yearly", year)


@router.get("/reports/init")
def init_reports() -> dict:
    return get_or_generate_reports()


@router.post("/reports/refresh")
def refresh_reports_api() -> dict:
    return refresh_reports()
