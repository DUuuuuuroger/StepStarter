from __future__ import annotations

from backend.app.data.repo import get_calendar_day


def get_day_summary(date_value: str) -> dict:
    items = get_calendar_day(date_value)
    total_seconds = sum(item["total_duration_seconds"] for item in items)
    return {
        "date": date_value,
        "total_duration_seconds": total_seconds,
        "items": items,
    }
