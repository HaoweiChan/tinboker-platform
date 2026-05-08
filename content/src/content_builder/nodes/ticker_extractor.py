"""Ticker recommendations extractor node."""

import json
from typing import Any

from content_builder.llm import get_model, load_prompt
from content_builder.state import PipelineState


_RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "meta": {
            "type": "object",
            "properties": {
                "episode_id": {"type": "string"},
                "publication_date": {"type": "string"},
                "podcaster": {"type": "string"},
            },
            "required": ["episode_id", "publication_date", "podcaster"],
        },
        "ticker_recommendations": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "ticker": {"type": "string"},
                    "sentiment": {"type": "string"},
                    "sentiment_score": {"type": "number"},
                    "time_horizon": {"type": "string"},
                    "bluf_thesis": {"type": "string"},
                    "price_target": {"type": "number"},
                    "reasons": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "title": {"type": "string"},
                                "description": {"type": "string"},
                                "category": {"type": "string"},
                                "start_index": {"type": "integer"},
                                "end_index": {"type": "integer"},
                                "start_time": {"type": "integer"},
                                "end_time": {"type": "integer"},
                            },
                            "required": ["title", "description", "category"],
                        },
                    },
                    "risks": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "title": {"type": "string"},
                                "description": {"type": "string"},
                                "severity": {"type": "string"},
                                "start_index": {"type": "integer"},
                                "end_index": {"type": "integer"},
                                "start_time": {"type": "integer"},
                                "end_time": {"type": "integer"},
                            },
                            "required": ["title", "description", "severity"],
                        },
                    },
                },
                "required": ["ticker", "sentiment", "sentiment_score", "bluf_thesis", "reasons"],
            },
        },
    },
    "required": ["meta", "ticker_recommendations"],
}


def extract_tickers(state: PipelineState) -> dict[str, Any]:
    """Extract ticker recommendations from clustered events."""
    prompts = load_prompt("ticker_extractor")
    events_json = json.dumps(state.get("clustered_events", []), ensure_ascii=False)

    user_msg = prompts["user"].format(
        events=events_json,
        source=state.get("source", "Podcast"),
        episode_title=state.get("episode_title", "Episode"),
    )

    model = get_model("ticker_extractor")
    response = model.invoke(
        [
            {"role": "system", "content": prompts["system"]},
            {"role": "user", "content": user_msg},
        ],
        response_format={"type": "json_object", "schema": _RESPONSE_SCHEMA},
    )

    result = json.loads(response.content)
    return {"ticker_recommendations": result}
