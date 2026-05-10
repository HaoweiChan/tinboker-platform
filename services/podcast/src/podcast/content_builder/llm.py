"""LLM configuration and prompt loading utilities."""

from __future__ import annotations

import json
import os
import re
import time
from functools import lru_cache
from pathlib import Path

import yaml
from langchain_google_genai import ChatGoogleGenerativeAI


_PROMPTS_DIR = Path(__file__).parent / "prompts"
_MAX_RETRIES = 2

_MODEL_MAP: dict[str, str] = {
    "extractor": os.getenv("EXTRACTOR_MODEL", "gemini-2.5-flash"),
    "writer": os.getenv("WRITER_MODEL", "gemini-2.5-flash"),
    "marp_writer": os.getenv("MARP_WRITER_MODEL", "gemini-2.5-flash"),
    "ticker_extractor": os.getenv("TICKER_EXTRACTOR_MODEL", "gemini-2.5-flash"),
}

_TEMPERATURE_MAP: dict[str, float] = {
    "extractor": 0.1,
    "writer": 0.4,
    "marp_writer": 0.4,
    "ticker_extractor": 0.1,
}


@lru_cache(maxsize=8)
def load_prompt(name: str) -> dict[str, str]:
    """Load a prompt YAML file and return system/user templates."""
    path = _PROMPTS_DIR / f"{name}.yaml"
    with path.open("r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def get_model(role: str) -> ChatGoogleGenerativeAI:
    """Get a configured LLM instance for a given pipeline role."""
    model_name = _MODEL_MAP.get(role, "gemini-2.5-flash")
    temperature = _TEMPERATURE_MAP.get(role, 0.2)

    return ChatGoogleGenerativeAI(
        model=model_name,
        temperature=temperature,
        google_api_key=os.getenv("GOOGLE_API_KEY"),
    )


def _sanitize_json_text(text: str) -> str:
    """Strip markdown fences and trailing commas that Gemini sometimes emits."""
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*\n?", "", text)
        text = re.sub(r"\n?```\s*$", "", text)
    return text


def invoke_json(role: str, messages: list[dict], schema: dict | None = None) -> dict:
    """Invoke the LLM and parse the response as JSON.

    Uses Gemini's native JSON mode (response_mime_type) for reliable
    structured output.  Retries up to ``_MAX_RETRIES`` times on parse
    failures.  ``strict=False`` tolerates control characters that Gemini
    occasionally emits inside string values.
    """
    model = get_model(role)
    last_err: Exception | None = None
    for attempt in range(_MAX_RETRIES + 1):
        response = model.invoke(messages, response_mime_type="application/json")
        raw = _sanitize_json_text(response.content)
        try:
            return json.loads(raw, strict=False)
        except json.JSONDecodeError as exc:
            last_err = exc
            if attempt < _MAX_RETRIES:
                wait = 2 ** attempt
                print(f"  ⚠ JSON parse failed (attempt {attempt + 1}): {exc} — retrying in {wait}s")
                time.sleep(wait)
    raise ValueError(f"LLM JSON output unparseable after {_MAX_RETRIES + 1} attempts: {last_err}")
