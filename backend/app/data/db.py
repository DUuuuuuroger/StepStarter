from __future__ import annotations

import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

def _get_db_dir() -> Path:
    appdata = os.getenv("APPDATA")
    if appdata:
        base_dir = Path(appdata)
    else:
        roaming = Path.home() / "AppData" / "Roaming"
        base_dir = roaming if roaming.exists() else Path.home() / "StepStarter"

    if base_dir.name.lower() == "stepstarter":
        db_dir = base_dir
    else:
        db_dir = base_dir / "StepStarter"

    db_dir.mkdir(parents=True, exist_ok=True)
    return db_dir


DB_PATH = _get_db_dir() / "stepstarter.db"


def now_iso() -> str:
    local_time = datetime.now().replace(second=0, microsecond=0)
    return local_time.strftime("%Y-%m-%d %H:%M")


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
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                user_input TEXT NOT NULL,
                status TEXT NOT NULL,
                progress INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        columns = {
            row["name"] for row in conn.execute("PRAGMA table_info(tasks)").fetchall()
        }
        if "total_duration_seconds" not in columns:
            conn.execute(
                "ALTER TABLE tasks ADD COLUMN total_duration_seconds INTEGER"
            )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS steps (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id INTEGER NOT NULL,
                idx INTEGER NOT NULL,
                title TEXT NOT NULL,
                detail TEXT,
                encouragement TEXT,
                done INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY(task_id) REFERENCES tasks(id)
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id INTEGER NOT NULL,
                start_time TEXT NOT NULL,
                end_time TEXT NOT NULL,
                paused_total_seconds INTEGER NOT NULL DEFAULT 0,
                duration_seconds INTEGER NOT NULL,
                FOREIGN KEY(task_id) REFERENCES tasks(id)
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                period TEXT NOT NULL,
                period_key TEXT NOT NULL,
                content TEXT NOT NULL,
                generated_at TEXT NOT NULL,
                UNIQUE(period, period_key)
            )
            """
        )
