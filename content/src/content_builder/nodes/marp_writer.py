"""Marp writer node: generates structured slide data from clustered events."""

import json
from typing import Any

from content_builder.llm import get_model, load_prompt
from content_builder.state import PipelineState


_RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "title": {"type": "string"},
        "slides": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "heading": {"type": "string"},
                    "content": {"type": "string"},
                    "bullet_points": {"type": "array", "items": {"type": "string"}},
                    "start_time": {"type": "integer"},
                    "slide_notes": {"type": "string"},
                },
                "required": ["heading", "content", "bullet_points"],
            },
        },
    },
    "required": ["title", "slides"],
}


def write_marp_slides(state: PipelineState) -> dict[str, Any]:
    """Generate structured Marp slide data from clustered events."""
    prompts = load_prompt("marp_writer")
    events_json = json.dumps(state.get("clustered_events", []), ensure_ascii=False)

    user_msg = prompts["user"].format(
        events=events_json,
        source=state.get("source", "Podcast"),
        episode_title=state.get("episode_title", "Episode"),
    )

    model = get_model("marp_writer")
    response = model.invoke(
        [
            {"role": "system", "content": prompts["system"]},
            {"role": "user", "content": user_msg},
        ],
        response_format={"type": "json_object", "schema": _RESPONSE_SCHEMA},
    )

    result = json.loads(response.content)
    return {"marp_slides": result}
