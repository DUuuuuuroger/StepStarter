from __future__ import annotations

from backend.app.data.db import get_connection, init_db, now_iso


def get_settings() -> dict:
    init_db()
    with get_connection() as conn:
        row = conn.execute(
            "SELECT base_url, api_key, model FROM settings WHERE id = 1"
        ).fetchone()
    return {
        "base_url": row["base_url"],
        "api_key": row["api_key"],
        "model": row["model"],
    }


def update_settings(base_url: str | None, api_key: str | None, model: str | None) -> dict:
    init_db()
    with get_connection() as conn:
        row = conn.execute(
            "SELECT base_url, api_key, model FROM settings WHERE id = 1"
        ).fetchone()
        new_base_url = base_url if base_url is not None else row["base_url"]
        new_api_key = api_key if api_key is not None else row["api_key"]
        new_model = model if model is not None else row["model"]

        conn.execute(
            """
            UPDATE settings
            SET base_url = ?, api_key = ?, model = ?, updated_at = ?
            WHERE id = 1
            """,
            (new_base_url, new_api_key, new_model, now_iso()),
        )

    return {
        "base_url": new_base_url,
        "api_key": new_api_key,
        "model": new_model,
    }


def create_task(title: str, user_input: str, steps: list[dict]) -> int:
    init_db()
    timestamp = now_iso()
    with get_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO tasks (title, user_input, status, progress, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (title, user_input, "active", 0, timestamp, timestamp),
        )
        task_id = cursor.lastrowid
        for idx, step in enumerate(steps, start=1):
            conn.execute(
                """
                INSERT INTO steps (task_id, idx, title, detail, encouragement, done, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    task_id,
                    idx,
                    step.get("title", ""),
                    step.get("detail", ""),
                    step.get("encouragement", ""),
                    0,
                    timestamp,
                    timestamp,
                ),
            )
    return int(task_id)


def list_tasks(limit: int = 20) -> list[dict]:
    init_db()
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT id, title, status, progress, created_at
            FROM tasks
            ORDER BY id DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()
    return [
        {
            "id": row["id"],
            "title": row["title"],
            "status": row["status"],
            "progress": row["progress"],
            "created_at": row["created_at"],
        }
        for row in rows
    ]


def get_task_steps(task_id: int) -> list[dict]:
    init_db()
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT id, idx, title, detail, encouragement, done
            FROM steps
            WHERE task_id = ?
            ORDER BY idx ASC
            """,
            (task_id,),
        ).fetchall()
    return [
        {
            "id": row["id"],
            "idx": row["idx"],
            "title": row["title"],
            "detail": row["detail"],
            "encouragement": row["encouragement"],
            "done": bool(row["done"]),
        }
        for row in rows
    ]


def delete_task(task_id: int) -> None:
    init_db()
    with get_connection() as conn:
        conn.execute("DELETE FROM steps WHERE task_id = ?", (task_id,))
        conn.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
