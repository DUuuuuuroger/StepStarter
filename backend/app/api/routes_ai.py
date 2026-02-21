from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.app.data.repo import get_settings
from backend.app.services.step_generator import generate_steps

router = APIRouter()


class StepsRequest(BaseModel):
    input: str


@router.post("/ai/steps")
def generate_steps_api(payload: StepsRequest) -> dict:
    if not payload.input.strip():
        raise HTTPException(status_code=400, detail="input is required")

    settings = get_settings()
    base_url = settings.get("base_url", "").strip()
    api_key = settings.get("api_key", "").strip()
    model = settings.get("model")

    if not base_url or not api_key:
        raise HTTPException(status_code=400, detail="base_url and api_key are required in settings")

    try:
        return generate_steps(payload.input, base_url, api_key, model)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
