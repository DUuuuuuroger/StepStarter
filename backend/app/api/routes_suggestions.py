from fastapi import APIRouter

from backend.app.services.suggestion_service import get_next_start_suggestion

router = APIRouter()


@router.get("/suggestions/next-start")
def get_next_start_suggestion_api() -> dict:
    return get_next_start_suggestion()
