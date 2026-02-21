from fastapi import APIRouter
from pydantic import BaseModel

from backend.app.data.repo import get_settings, update_settings

router = APIRouter()


class SettingsOut(BaseModel):
    base_url: str
    api_key: str
    model: str | None


class SettingsIn(BaseModel):
    base_url: str | None = None
    api_key: str | None = None
    model: str | None = None


@router.get("/settings", response_model=SettingsOut)
def read_settings() -> dict:
    return get_settings()


@router.patch("/settings", response_model=SettingsOut)
def patch_settings(payload: SettingsIn) -> dict:
    return update_settings(payload.base_url, payload.api_key, payload.model)
