from __future__ import annotations

import sqlite3
from datetime import datetime, timezone
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent / "stepstarter.db"


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with get_connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                base_url TEXT NOT NULL,
                api_key TEXT NOT NULL,
                model TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        existing = conn.execute("SELECT id FROM settings WHERE id = 1").fetchone()
        if existing is None:
            timestamp = now_iso()
            conn.execute(
                """
                INSERT INTO settings (id, base_url, api_key, model, created_at, updated_at)
                VALUES (1, ?, ?, ?, ?, ?)
                """,
                ("https://api.openai.com/v1", "", None, timestamp, timestamp),
            )
