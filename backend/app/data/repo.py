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
