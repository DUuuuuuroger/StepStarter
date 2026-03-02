from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from backend.app.data.repo import create_session, update_task_progress


@dataclass
class _TimerState:
    task_id: int
    status: str
    started_at: datetime
    paused_at: datetime | None = None
    paused_total_seconds: int = 0


_state: _TimerState | None = None


def _now() -> datetime:
    return datetime.now()


def _format_time(value: datetime) -> str:
    return value.strftime("%Y-%m-%d %H:%M:%S")


def _calculate_elapsed(now: datetime, state: _TimerState) -> int:
    paused_total = state.paused_total_seconds
    if state.status == "paused" and state.paused_at:
        paused_total += int((now - state.paused_at).total_seconds())
    elapsed = int((now - state.started_at).total_seconds()) - paused_total
    return max(elapsed, 0)


def _status_payload(now: datetime, state: _TimerState) -> dict:
    paused_total = state.paused_total_seconds
    paused_at = state.paused_at
    if state.status == "paused" and paused_at:
        paused_total += int((now - paused_at).total_seconds())
    return {
        "status": state.status,
        "task_id": state.task_id,
        "started_at": _format_time(state.started_at),
        "paused_at": _format_time(paused_at) if paused_at else None,
        "paused_total_seconds": paused_total,
        "elapsed_seconds": _calculate_elapsed(now, state),
    }


def reset_timer_state() -> None:
    global _state
    _state = None


def start_timer(task_id: int) -> dict:
    global _state
    now = _now()

    if _state is None:
        _state = _TimerState(task_id=task_id, status="running", started_at=now)
        return _status_payload(now, _state)

    if _state.status == "paused":
        if _state.task_id != task_id:
            raise ValueError("timer is paused for another task")
        if _state.paused_at:
            _state.paused_total_seconds += int((now - _state.paused_at).total_seconds())
        _state.paused_at = None
        _state.status = "running"
        return _status_payload(now, _state)

    raise ValueError("timer is already running")


def pause_timer() -> dict:
    if _state is None:
        raise ValueError("no active timer")
    if _state.status != "running":
        raise ValueError("timer is not running")

    now = _now()
    _state.status = "paused"
    _state.paused_at = now
    return _status_payload(now, _state)


def stop_timer() -> dict:
    global _state
    if _state is None:
        raise ValueError("no active timer")

    now = _now()
    paused_total = _state.paused_total_seconds
    if _state.status == "paused" and _state.paused_at:
        paused_total += int((now - _state.paused_at).total_seconds())

    duration_seconds = max(
        int((now - _state.started_at).total_seconds()) - paused_total,
        0,
    )
    session_id = create_session(
        _state.task_id,
        _format_time(_state.started_at),
        _format_time(now),
        paused_total,
        duration_seconds,
    )
    payload = {
        "status": "stopped",
        "session_id": session_id,
        "task_id": _state.task_id,
        "started_at": _format_time(_state.started_at),
        "ended_at": _format_time(now),
        "paused_total_seconds": paused_total,
        "duration_seconds": duration_seconds,
    }
    _state = None
    return payload


def get_status() -> dict:
    if _state is None:
        return {
            "status": "idle",
            "task_id": None,
            "started_at": None,
            "paused_at": None,
            "paused_total_seconds": 0,
            "elapsed_seconds": 0,
        }

    now = _now()
    return _status_payload(now, _state)


def stop_timer_on_shutdown() -> None:
    global _state
    if _state is None:
        return

    now = _now()
    paused_total = _state.paused_total_seconds
    if _state.status == "paused" and _state.paused_at:
        paused_total += int((now - _state.paused_at).total_seconds())

    duration_seconds = max(
        int((now - _state.started_at).total_seconds()) - paused_total,
        0,
    )
    create_session(
        _state.task_id,
        _format_time(_state.started_at),
        _format_time(now),
        paused_total,
        duration_seconds,
    )
    update_task_progress(_state.task_id, 0)
    _state = None
