"""Writer node: generates structured financial article from clustered events."""

import json
from typing import Any

from content_builder.llm import get_model, load_prompt
from content_builder.state import PipelineState


_RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "title": {"type": "string"},
        "executive_summary": {"type": "string"},
        "sections": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "heading": {"type": "string"},
                    "content": {"type": "string"},
                    "start_time": {"type": "integer"},
                    "subsections": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "heading": {"type": "string"},
                                "content": {"type": "string"},
                            },
                            "required": ["heading", "content"],
                        },
                    },
                },
                "required": ["heading", "content"],
            },
        },
        "conclusion": {"type": "string"},
        "stock_tickers": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "display_name": {"type": "string"},
                    "symbol": {"type": "string"},
                },
                "required": ["display_name", "symbol"],
            },
        },
        "tags": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "display_name": {"type": "string"},
                    "tag_name": {"type": "string"},
                },
                "required": ["display_name", "tag_name"],
            },
        },
    },
    "required": ["title", "executive_summary", "sections", "conclusion"],
}


def write_article(state: PipelineState) -> dict[str, Any]:
    """Generate a structured financial article from clustered events."""
    prompts = load_prompt("writer")
    events_json = json.dumps(state.get("clustered_events", []), ensure_ascii=False)

    user_msg = prompts["user"].format(
        events=events_json,
        source=state.get("source", "Podcast"),
        episode_title=state.get("episode_title", "Episode"),
    )

    model = get_model("writer")
    response = model.invoke(
        [
            {"role": "system", "content": prompts["system"]},
            {"role": "user", "content": user_msg},
        ],
        response_format={"type": "json_object", "schema": _RESPONSE_SCHEMA},
    )

    result = json.loads(response.content)
    return {"writer_output": result}
