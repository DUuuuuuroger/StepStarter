from __future__ import annotations

from typing import Any

import re

from langdetect import detect

from backend.app.services.llm_client import LLMClient

DEFAULT_MODEL = "gpt-4o-mini"


def generate_steps(user_input: str, base_url: str, api_key: str, model: str | None) -> dict[str, Any]:
    selected_model = model or DEFAULT_MODEL
    client = LLMClient(base_url=base_url, api_key=api_key, model=selected_model)
    language = _detect_language(user_input)

    system_prompt = (
        "You are a helpful assistant that breaks a goal into tiny, concrete, actionable steps. "
        "Return ONLY valid JSON."
    )
    user_prompt = (
        "Generate 5-12 tiny steps for the user's goal. "
        "Each step must be a single action under 15 words. "
        "Output JSON with keys: title (string), steps (array of objects), tags (array). "
        "Each step object must have: title (short summary), detail (short supportive detail), "
        "encouragement (warm, motivating sentence). "
        f"Use the same language as the user: {language}. "
        "Do not mix languages. Do not leave encouragement empty. "
        "Make the detail gentle and slightly encouraging. "
        f"User goal: {user_input}"
    )

    result = client.chat_json(system_prompt, user_prompt)
    return _validate(result, language)


def _validate(result: dict[str, Any], language: str = "English") -> dict[str, Any]:
    title = str(result.get("title", "")).strip()
    steps = result.get("steps", [])
    tags = result.get("tags", [])

    if not title:
        raise ValueError("Missing title")
    if not isinstance(steps, list):
        raise ValueError("Steps must be a list")

    normalized_steps: list[dict[str, str]] = []
    for step in steps:
        if isinstance(step, str):
            step_title = step.strip()
            if not step_title:
                continue
            normalized_steps.append(
                {
                    "title": step_title,
                    "detail": "",
                    "encouragement": "做完这一小步，就更接近目标了。",
                }
            )
            continue

        if isinstance(step, dict):
            step_title = str(step.get("title", "")).strip()
            step_detail = str(step.get("detail", "")).strip()
            step_encouragement = str(step.get("encouragement", "")).strip()
            if not step_title:
                continue
            if not step_detail:
                step_detail = _default_detail(language)
            if not step_encouragement:
                step_encouragement = _default_encouragement(language)
            normalized_steps.append(
                {
                    "title": step_title,
                    "detail": step_detail,
                    "encouragement": step_encouragement,
                }
            )
            continue

    if len(normalized_steps) < 5 or len(normalized_steps) > 12:
        raise ValueError("Steps must have 5-12 items")

    return {
        "title": title,
        "steps": normalized_steps,
        "tags": tags if isinstance(tags, list) else [],
    }


def _detect_language(text: str) -> str:
    if not text.strip():
        return "English"

    chinese_count = len(re.findall(r"[\u4e00-\u9fff]", text))
    latin_count = len(re.findall(r"[A-Za-z]", text))
    french_mark_count = len(
        re.findall(r"[àâäçéèêëîïôöùûüÿœæ]", text, re.IGNORECASE)
    )

    if chinese_count > latin_count:
        return "Chinese"

    if french_mark_count > 0:
        return "French"

    if latin_count > 0:
        return "English"

    try:
        code = detect(text)
    except Exception:
        return "English"

    if code in {"zh", "zh-cn", "zh-tw"}:
        return "Chinese"
    if code == "fr":
        return "French"
    return "English"


def _default_encouragement(language: str) -> str:
    if language == "Chinese":
        return "只要开始这一步，就已经在向前走了。"
    if language == "French":
        return "Tu avances déjà en faisant ce petit pas."
    return "You are already moving forward with this small step."


def _default_detail(language: str) -> str:
    if language == "Chinese":
        return "只需要完成这个小动作就好。"
    if language == "French":
        return "Il suffit de faire ce petit geste."
    return "Just finish this tiny action."
