from __future__ import annotations

from backend.app.data.repo import get_first_pending_step, list_pending_tasks


def get_next_start_suggestion() -> dict:
    pending_tasks = list_pending_tasks(limit=1)
    if not pending_tasks:
        return {"task": None, "step": None}

    task = pending_tasks[0]
    step = get_first_pending_step(task["id"])
    return {
        "task": {
            "id": task["id"],
            "title": task["title"],
            "progress": task["progress"],
        },
        "step": step,
    }
