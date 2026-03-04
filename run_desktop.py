from __future__ import annotations

import atexit
import os
import signal
import subprocess
import sys
import time
import urllib.error
import urllib.request
from threading import Thread
from pathlib import Path

import webview

HOST = "127.0.0.1"
PORT = 8000
HEALTH_URL = f"http://{HOST}:{PORT}/health"
ROOT_URL = f"http://{HOST}:{PORT}/"
HEALTH_TIMEOUT_SECONDS = 10

_SERVER_PROCESS: subprocess.Popen[str] | None = None
_SERVER_LOG_HANDLE = None
_STOPPING = False


def get_resource_path(relative_path: str) -> Path:
    if getattr(sys, "frozen", False):
        meipass = Path(getattr(sys, "_MEIPASS", ""))
        candidates = []
        if meipass:
            candidates.append(meipass / relative_path)
        exe_dir = Path(sys.executable).resolve().parent
        candidates.append(exe_dir / relative_path)
        candidates.append(exe_dir / "_internal" / relative_path)
        for candidate in candidates:
            if candidate.exists():
                return candidate
        return candidates[-1]

    return Path(__file__).resolve().parent / relative_path


def _poll_health(timeout_seconds: int) -> bool:
    deadline = time.monotonic() + timeout_seconds
    while time.monotonic() < deadline:
        try:
            with urllib.request.urlopen(HEALTH_URL, timeout=1) as response:
                body = response.read().decode("utf-8", errors="ignore").strip().lower()
                normalized = body.strip('"')
                if normalized == "ok":
                    return True
        except (urllib.error.URLError, TimeoutError):
            time.sleep(0.3)
    return False


def _root_available() -> bool:
    try:
        with urllib.request.urlopen(ROOT_URL, timeout=1) as response:
            return response.status == 200
    except (urllib.error.URLError, TimeoutError):
        return False


def _start_server_process() -> subprocess.Popen[str]:
    python_exe = sys.executable
    if getattr(sys, "frozen", False):
        base_dir = Path(sys.executable).resolve().parent
    else:
        base_dir = Path(__file__).resolve().parent
    env = os.environ.copy()

    if getattr(sys, "frozen", False):
        cmd = [python_exe, "--run-server"]
    else:
        env["PYTHONPATH"] = str(base_dir)
        cmd = [python_exe, str(Path(__file__).resolve()), "--run-server"]

    proc = subprocess.Popen(
        cmd,
        cwd=str(base_dir),
        env=env,
        creationflags=getattr(subprocess, "CREATE_NEW_PROCESS_GROUP", 0),
    )
    return proc


def _stop_server_process() -> None:
    global _SERVER_PROCESS, _STOPPING
    if _STOPPING:
        return
    _STOPPING = True
    proc = _SERVER_PROCESS
    if not proc:
        return
    if proc.poll() is not None:
        return
    try:
        if os.name == "nt":
            subprocess.run(
                ["taskkill", "/T", "/F", "/PID", str(proc.pid)],
                check=False,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
            )
        else:
            proc.terminate()
    except Exception:
        proc.terminate()

    try:
        proc.wait(timeout=5)
    except subprocess.TimeoutExpired:
        proc.kill()
    _SERVER_PROCESS = None


def _install_exit_handlers() -> None:
    atexit.register(_stop_server_process)

    def _handler(_signum: int, _frame: object) -> None:
        _stop_server_process()
        raise SystemExit(0)

    signal.signal(signal.SIGINT, _handler)
    signal.signal(signal.SIGTERM, _handler)


def _run_server() -> None:
    from backend.app.main_api import app
    import uvicorn

    uvicorn.run(app, host=HOST, port=PORT, log_level="info")


def _open_window() -> None:
    local_index = get_resource_path("frontend/index.html").resolve()
    url = str(local_index)

    window = webview.create_window(
        "StepStarter",
        url,
        width=1200,
        height=800,
        frameless=False,
        easy_drag=False,
    )
    window.events.closed += lambda: _stop_server_process()

    def _switch_to_backend() -> None:
        if _poll_health(HEALTH_TIMEOUT_SECONDS):
            if _root_available():
                window.load_url(ROOT_URL)
            else:
                pass

    def _background_tasks() -> None:
        Thread(target=_switch_to_backend, daemon=True).start()

    webview.start(_background_tasks)


def main() -> None:
    global _SERVER_PROCESS
    if "--run-server" in sys.argv:
        _run_server()
        return

    _install_exit_handlers()
    _SERVER_PROCESS = _start_server_process()
    _open_window()


if __name__ == "__main__":
    main()
