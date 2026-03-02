from __future__ import annotations

from datetime import datetime, timedelta
import sys
from pathlib import Path

from fastapi.testclient import TestClient

ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.app.data import db, repo
from backend.app.main_api import app
from backend.app.services import timer_service


def test_timer_flow(tmp_path, monkeypatch):
    db.DB_PATH = tmp_path / "test_timer.db"
    db.init_db()
    timer_service.reset_timer_state()

    task_id = repo.create_task(
        "测试任务",
        "测试输入",
        [{"title": "步骤 1", "detail": "", "encouragement": ""}],
    )

    base_time = datetime(2026, 1, 1, 12, 0, 0)
    current = {"value": base_time}

    def fake_now():
        return current["value"]

    monkeypatch.setattr(timer_service, "_now", fake_now)

    client = TestClient(app)

    resp = client.post("/timer/start", json={"task_id": task_id})
    assert resp.status_code == 200
    assert resp.json()["status"] == "running"

    current["value"] = base_time + timedelta(seconds=5)
    resp = client.get("/timer/status")
    assert resp.status_code == 200
    assert resp.json()["elapsed_seconds"] == 5

    resp = client.post("/timer/pause")
    assert resp.status_code == 200
    assert resp.json()["status"] == "paused"

    current["value"] = base_time + timedelta(seconds=15)
    resp = client.get("/timer/status")
    assert resp.status_code == 200
    assert resp.json()["elapsed_seconds"] == 5

    resp = client.post("/timer/start", json={"task_id": task_id})
    assert resp.status_code == 200
    assert resp.json()["status"] == "running"

    current["value"] = base_time + timedelta(seconds=35)
    resp = client.post("/timer/stop")
    assert resp.status_code == 200
    payload = resp.json()
    assert payload["duration_seconds"] == 25
    assert payload["paused_total_seconds"] == 10
    assert payload["session_id"]

    with db.get_connection() as conn:
        row = conn.execute(
            "SELECT duration_seconds, paused_total_seconds FROM sessions WHERE id = ?",
            (payload["session_id"],),
        ).fetchone()
    assert row["duration_seconds"] == 25
    assert row["paused_total_seconds"] == 10


def test_timer_shutdown_resets_progress(tmp_path, monkeypatch):
    db.DB_PATH = tmp_path / "test_timer_shutdown.db"
    db.init_db()
    timer_service.reset_timer_state()

    task_id = repo.create_task(
        "测试任务",
        "测试输入",
        [{"title": "步骤 1", "detail": "", "encouragement": ""}],
    )
    repo.update_task_progress(task_id, 60)

    base_time = datetime(2026, 1, 1, 10, 0, 0)
    current = {"value": base_time}

    def fake_now():
        return current["value"]

    monkeypatch.setattr(timer_service, "_now", fake_now)

    timer_service.start_timer(task_id)
    current["value"] = base_time + timedelta(seconds=90)
    timer_service.stop_timer_on_shutdown()

    with db.get_connection() as conn:
        row = conn.execute(
            "SELECT progress FROM tasks WHERE id = ?",
            (task_id,),
        ).fetchone()
        session = conn.execute(
            "SELECT duration_seconds FROM sessions WHERE task_id = ?",
            (task_id,),
        ).fetchone()

    assert row["progress"] == 0
    assert session["duration_seconds"] == 90


def test_next_start_suggestion(tmp_path):
    db.DB_PATH = tmp_path / "test_suggestion.db"
    db.init_db()
    timer_service.reset_timer_state()

    first_id = repo.create_task(
        "任务 A",
        "输入 A",
        [{"title": "A-1", "detail": "", "encouragement": ""}],
    )
    second_id = repo.create_task(
        "任务 B",
        "输入 B",
        [{"title": "B-1", "detail": "", "encouragement": ""}],
    )
    repo.update_task_progress(first_id, 20)
    repo.update_task_progress(second_id, 10)

    from backend.app.services.suggestion_service import get_next_start_suggestion

    suggestion = get_next_start_suggestion()
    assert suggestion["task"]["id"] == second_id
    assert suggestion["step"]["title"] == "B-1"


def test_calendar_day_summary(tmp_path):
    db.DB_PATH = tmp_path / "test_calendar.db"
    db.init_db()
    timer_service.reset_timer_state()

    task_id = repo.create_task(
        "日历任务",
        "输入",
        [{"title": "步骤 1", "detail": "", "encouragement": ""}],
    )
    repo.create_session(task_id, "2026-03-01 10:00:00", "2026-03-01 10:30:00", 0, 1800)

    from backend.app.services.calendar_service import get_day_summary

    summary = get_day_summary("2026-03-01")
    assert summary["date"] == "2026-03-01"
    assert summary["total_duration_seconds"] == 1800
    assert summary["items"][0]["task_id"] == task_id


def test_report_period_range():
    from backend.app.services.report_service import get_period_range

    start, end = get_period_range("weekly", "2026-W09")
    assert start.endswith("-02-23")
    assert end.endswith("-03-01")
    start, end = get_period_range("monthly", "2026-03")
    assert start == "2026-03-01"
    assert end == "2026-03-31"
    start, end = get_period_range("yearly", "2026")
    assert start == "2026-01-01"
    assert end == "2026-12-31"
