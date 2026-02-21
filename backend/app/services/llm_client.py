from __future__ import annotations

import json
from typing import Any

import httpx


class LLMClient:
    def __init__(self, base_url: str, api_key: str, model: str) -> None:
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.model = model

    def _headers(self) -> dict:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    def chat_json(self, system_prompt: str, user_prompt: str, timeout_s: float = 20.0) -> dict[str, Any]:
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.2,
            "response_format": {"type": "json_object"},
        }

        url = f"{self.base_url}/chat/completions"

        with httpx.Client(timeout=timeout_s) as client:
            resp = client.post(url, headers=self._headers(), json=payload)

        if resp.status_code >= 400:
            raise RuntimeError(f"LLM request failed: {resp.status_code} {resp.text}")

        data = resp.json()
        content = data["choices"][0]["message"]["content"]
        return json.loads(content)
