from __future__ import annotations

from typing import Any

from backend.app.services.llm_client import LLMClient

DEFAULT_MODEL = "gpt-4o-mini"


def generate_steps(user_input: str, base_url: str, api_key: str, model: str | None) -> dict[str, Any]:
    selected_model = model or DEFAULT_MODEL
    client = LLMClient(base_url=base_url, api_key=api_key, model=selected_model)

    system_prompt = (
        "You are a helpful assistant that breaks a goal into tiny, concrete, actionable steps. "
        "Return ONLY valid JSON."
    )
    user_prompt = (
        "Generate 5-12 tiny steps for the user's goal. "
        "Each step must be a single action under 15 words. "
        "Output JSON with keys: title (string), steps (array of strings), tags (array). "
        f"User goal: {user_input}"
    )

    result = client.chat_json(system_prompt, user_prompt)
    return _validate(result)


def _validate(result: dict[str, Any]) -> dict[str, Any]:
    title = str(result.get("title", "")).strip()
    steps = result.get("steps", [])
    tags = result.get("tags", [])

    if not title:
        raise ValueError("Missing title")
    if not isinstance(steps, list):
        raise ValueError("Steps must be a list")

    cleaned_steps = [str(s).strip() for s in steps if str(s).strip()]
    if len(cleaned_steps) < 5 or len(cleaned_steps) > 12:
        raise ValueError("Steps must have 5-12 items")

    return {
        "title": title,
        "steps": cleaned_steps,
        "tags": tags if isinstance(tags, list) else [],
    }
