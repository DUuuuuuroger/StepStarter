import sys
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.app.api.routes_ai import router as ai_router
from backend.app.api.routes_settings import router as settings_router
from backend.app.api.routes_tasks import router as tasks_router
from backend.app.api.routes_timer import router as timer_router
from backend.app.api.routes_suggestions import router as suggestions_router
from backend.app.api.routes_calendar import router as calendar_router
from backend.app.api.routes_reports import router as reports_router
from backend.app.services.timer_service import stop_timer_on_shutdown


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    stop_timer_on_shutdown()


app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(ai_router)
app.include_router(settings_router)
app.include_router(tasks_router)
app.include_router(timer_router)
app.include_router(suggestions_router)
app.include_router(calendar_router)
app.include_router(reports_router)


@app.get("/health")
def health_check() -> str:
    return "ok"


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)
