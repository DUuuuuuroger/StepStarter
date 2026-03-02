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
            SELECT
                tasks.id AS task_id,
                tasks.title,
                tasks.status,
                tasks.progress,
                tasks.created_at,
                COALESCE(
                    tasks.total_duration_seconds,
                    SUM(sessions.duration_seconds),
                    0
                ) AS total_duration_seconds
            FROM tasks
            LEFT JOIN sessions ON sessions.task_id = tasks.id
            GROUP BY tasks.id
            ORDER BY tasks.id DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()
    return [
        {
            "id": row["task_id"],
            "title": row["title"],
            "status": row["status"],
            "progress": row["progress"],
            "created_at": row["created_at"],
            "total_duration_seconds": row["total_duration_seconds"],
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


def get_task(task_id: int) -> dict | None:
    init_db()
    with get_connection() as conn:
        row = conn.execute(
            """
            SELECT id, title, user_input, status, progress, created_at
            FROM tasks
            WHERE id = ?
            """,
            (task_id,),
        ).fetchone()
    if row is None:
        return None
    return {
        "id": row["id"],
        "title": row["title"],
        "user_input": row["user_input"],
        "status": row["status"],
        "progress": row["progress"],
        "created_at": row["created_at"],
    }


def delete_task(task_id: int) -> None:
    init_db()
    with get_connection() as conn:
        conn.execute("DELETE FROM steps WHERE task_id = ?", (task_id,))
        conn.execute("DELETE FROM tasks WHERE id = ?", (task_id,))


def update_task_progress(task_id: int, progress: int) -> None:
    init_db()
    with get_connection() as conn:
        conn.execute(
            """
            UPDATE tasks
            SET progress = ?, updated_at = ?
            WHERE id = ?
            """,
            (progress, now_iso(), task_id),
        )


def update_task_duration(task_id: int, total_duration_seconds: int) -> None:
    init_db()
    with get_connection() as conn:
        conn.execute(
            """
            UPDATE tasks
            SET total_duration_seconds = ?, updated_at = ?
            WHERE id = ?
            """,
            (total_duration_seconds, now_iso(), task_id),
        )


def list_pending_tasks(limit: int = 20) -> list[dict]:
    init_db()
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT id, title, status, progress, created_at, updated_at
            FROM tasks
            WHERE status != 'done' AND progress < 100
            ORDER BY updated_at DESC, id DESC
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
            "updated_at": row["updated_at"],
        }
        for row in rows
    ]


def get_first_pending_step(task_id: int) -> dict | None:
    init_db()
    with get_connection() as conn:
        row = conn.execute(
            """
            SELECT id, idx, title, detail, encouragement
            FROM steps
            WHERE task_id = ? AND done = 0
            ORDER BY idx ASC
            LIMIT 1
            """,
            (task_id,),
        ).fetchone()
    if row is None:
        return None
    return {
        "id": row["id"],
        "idx": row["idx"],
        "title": row["title"],
        "detail": row["detail"],
        "encouragement": row["encouragement"],
    }


def get_calendar_day(date_value: str) -> list[dict]:
    init_db()
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT
                tasks.id AS task_id,
                tasks.title AS title,
                COALESCE(
                    SUM(
                        CASE
                            WHEN date(sessions.start_time) = date(?) THEN sessions.duration_seconds
                            ELSE 0
                        END
                    ),
                    0
                ) AS total_duration_seconds
            FROM tasks
            LEFT JOIN sessions ON tasks.id = sessions.task_id
            WHERE date(tasks.created_at) = date(?) OR date(sessions.start_time) = date(?)
            GROUP BY tasks.id
            ORDER BY total_duration_seconds DESC, tasks.id DESC
            """,
            (date_value, date_value, date_value),
        ).fetchall()
    return [
        {
            "task_id": row["task_id"],
            "title": row["title"],
            "total_duration_seconds": row["total_duration_seconds"],
        }
        for row in rows
    ]


def get_stats_range(start_date: str, end_date: str) -> dict:
    init_db()
    with get_connection() as conn:
        sessions_row = conn.execute(
            """
            SELECT COUNT(*) AS sessions_count,
                   COALESCE(SUM(duration_seconds), 0) AS total_duration_seconds
            FROM sessions
            WHERE date(start_time) >= date(?) AND date(start_time) <= date(?)
            """,
            (start_date, end_date),
        ).fetchone()
        tasks_row = conn.execute(
            """
            SELECT COUNT(*) AS tasks_created,
                   SUM(CASE WHEN progress >= 100 THEN 1 ELSE 0 END) AS tasks_completed
            FROM tasks
            WHERE date(created_at) >= date(?) AND date(created_at) <= date(?)
            """,
            (start_date, end_date),
        ).fetchone()
        top_task_row = conn.execute(
            """
            SELECT tasks.id AS task_id,
                   tasks.title AS title,
                   COALESCE(SUM(sessions.duration_seconds), 0) AS total_duration_seconds
            FROM sessions
            JOIN tasks ON tasks.id = sessions.task_id
            WHERE date(sessions.start_time) >= date(?) AND date(sessions.start_time) <= date(?)
            GROUP BY tasks.id
            ORDER BY total_duration_seconds DESC, tasks.id DESC
            LIMIT 1
            """,
            (start_date, end_date),
        ).fetchone()
    return {
        "sessions_count": sessions_row["sessions_count"],
        "total_duration_seconds": sessions_row["total_duration_seconds"],
        "tasks_created": tasks_row["tasks_created"],
        "tasks_completed": tasks_row["tasks_completed"] or 0,
        "top_task": {
            "task_id": top_task_row["task_id"],
            "title": top_task_row["title"],
            "total_duration_seconds": top_task_row["total_duration_seconds"],
        }
        if top_task_row
        else None,
    }


def get_report(period: str, period_key: str) -> dict | None:
    init_db()
    with get_connection() as conn:
        row = conn.execute(
            """
            SELECT content, generated_at
            FROM reports
            WHERE period = ? AND period_key = ?
            """,
            (period, period_key),
        ).fetchone()
    if row is None:
        return None
    return {"content": row["content"], "generated_at": row["generated_at"]}


def upsert_report(period: str, period_key: str, content: str, generated_at: str) -> None:
    init_db()
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO reports (period, period_key, content, generated_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(period, period_key)
            DO UPDATE SET content = excluded.content, generated_at = excluded.generated_at
            """,
            (period, period_key, content, generated_at),
        )


def create_session(
    task_id: int,
    start_time: str,
    end_time: str,
    paused_total_seconds: int,
    duration_seconds: int,
) -> int:
    init_db()
    with get_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO sessions (task_id, start_time, end_time, paused_total_seconds, duration_seconds)
            VALUES (?, ?, ?, ?, ?)
            """,
            (task_id, start_time, end_time, paused_total_seconds, duration_seconds),
        )
    return int(cursor.lastrowid)
