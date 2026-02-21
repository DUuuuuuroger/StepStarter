from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.app.data.repo import create_task, delete_task, get_task_steps, list_tasks

router = APIRouter()


class StepIn(BaseModel):
    title: str
    detail: str | None = None
    encouragement: str | None = None


class TaskCreateIn(BaseModel):
    title: str
    user_input: str
    steps: list[StepIn]


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


@router.delete("/tasks/{task_id}")
def delete_task_api(task_id: int) -> dict:
    delete_task(task_id)
    return {"ok": True}
