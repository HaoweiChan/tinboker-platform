"""Event extraction node: identifies topics/sections from sentences."""

import json
from typing import Any

from content_builder.llm import get_model, load_prompt
from content_builder.state import PipelineState


_RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "events": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "start_index": {"type": "integer"},
                    "end_index": {"type": "integer"},
                    "section_topic": {"type": "string"},
                },
                "required": ["start_index", "end_index", "section_topic"],
            },
        }
    },
    "required": ["events"],
}


def extract_events(state: PipelineState) -> dict[str, Any]:
    """Extract topic events from transcript sentences."""
    prompts = load_prompt("extractor")
    sentences_json = json.dumps(state["sentences"], ensure_ascii=False)

    user_msg = prompts["user"].format(
        source=state.get("source", "Podcast"),
        episode_title=state.get("episode_title", "Episode"),
        sentences=sentences_json,
    )

    model = get_model("extractor")
    response = model.invoke(
        [
            {"role": "system", "content": prompts["system"]},
            {"role": "user", "content": user_msg},
        ],
        response_format={"type": "json_object", "schema": _RESPONSE_SCHEMA},
    )

    result = json.loads(response.content)
    return {"events": result.get("events", [])}
