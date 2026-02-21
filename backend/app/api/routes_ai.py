import asyncio
import json

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
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


@router.get("/ai/steps/stream")
async def generate_steps_stream(request: Request, input: str) -> StreamingResponse:
    if not input.strip():
        raise HTTPException(status_code=400, detail="input is required")

    settings = get_settings()
    base_url = settings.get("base_url", "").strip()
    api_key = settings.get("api_key", "").strip()
    model = settings.get("model")

    if not base_url or not api_key:
        raise HTTPException(status_code=400, detail="base_url and api_key are required in settings")

    async def event_stream():
        try:
            result = generate_steps(input, base_url, api_key, model)
            payload = {"title": result.get("title", "")}
            yield f"event: title\ndata: {json.dumps(payload, ensure_ascii=False)}\n\n"

            for step in result.get("steps", []):
                if isinstance(step, dict):
                    data = step
                else:
                    data = {"title": str(step), "detail": "", "encouragement": ""}
                yield f"event: step\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"
                await asyncio.sleep(0)
                if await request.is_disconnected():
                    break

            yield "event: done\ndata: {}\n\n"
        except Exception as exc:
            data = {"message": str(exc)}
            yield f"event: error\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
