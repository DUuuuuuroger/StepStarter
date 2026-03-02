from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.app.services.timer_service import get_status, pause_timer, start_timer, stop_timer

router = APIRouter()


class TimerStartIn(BaseModel):
    task_id: int


@router.post("/timer/start")
def start_timer_api(payload: TimerStartIn) -> dict:
    if payload.task_id <= 0:
        raise HTTPException(status_code=400, detail="task_id must be positive")
    try:
        return start_timer(payload.task_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/timer/pause")
def pause_timer_api() -> dict:
    try:
        return pause_timer()
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/timer/stop")
def stop_timer_api() -> dict:
    try:
        return stop_timer()
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/timer/status")
def timer_status_api() -> dict:
    return get_status()
