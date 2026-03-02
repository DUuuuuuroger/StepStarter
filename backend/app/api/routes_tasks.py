from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.app.data.repo import (
    create_task,
    delete_task,
    get_task,
    get_task_steps,
    list_tasks,
    update_task_duration,
    update_task_progress,
)

router = APIRouter()


class StepIn(BaseModel):
    title: str
    detail: str | None = None
    encouragement: str | None = None


class TaskCreateIn(BaseModel):
    title: str
    user_input: str
    steps: list[StepIn]


class TaskUpdateIn(BaseModel):
    progress: int | None = None
    total_duration_seconds: int | None = None


@router.post("/tasks")
def create_task_api(payload: TaskCreateIn) -> dict:
    if not payload.title.strip():
        raise HTTPException(status_code=400, detail="title is required")
    if not payload.user_input.strip():
        raise HTTPException(status_code=400, detail="user_input is required")
    if not payload.steps:
        raise HTTPException(status_code=400, detail="steps are required")

    steps = [
        {
            "title": step.title.strip(),
            "detail": (step.detail or "").strip(),
            "encouragement": (step.encouragement or "").strip(),
        }
        for step in payload.steps
        if step.title.strip()
    ]

    if not steps:
        raise HTTPException(status_code=400, detail="steps are required")

    task_id = create_task(payload.title.strip(), payload.user_input.strip(), steps)
    return {"id": task_id}


@router.get("/tasks")
def list_tasks_api(limit: int = 20) -> dict:
    return {"items": list_tasks(limit)}


@router.get("/tasks/{task_id}/steps")
def get_task_steps_api(task_id: int) -> dict:
    return {"items": get_task_steps(task_id)}


@router.get("/tasks/{task_id}")
def get_task_api(task_id: int) -> dict:
    task = get_task(task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="task not found")
    return task


@router.delete("/tasks/{task_id}")
def delete_task_api(task_id: int) -> dict:
    delete_task(task_id)
    return {"ok": True}


@router.patch("/tasks/{task_id}")
def update_task_api(task_id: int, payload: TaskUpdateIn) -> dict:
    if payload.progress is None and payload.total_duration_seconds is None:
        raise HTTPException(status_code=400, detail="progress or total_duration_seconds is required")
    if payload.progress is not None:
        if payload.progress < 0 or payload.progress > 100:
            raise HTTPException(status_code=400, detail="progress must be 0-100")
        update_task_progress(task_id, int(payload.progress))
    if payload.total_duration_seconds is not None:
        if payload.total_duration_seconds < 0:
            raise HTTPException(status_code=400, detail="total_duration_seconds must be >= 0")
        update_task_duration(task_id, int(payload.total_duration_seconds))
    return {"ok": True}
