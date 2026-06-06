"""Unit tests for the Threads publisher: post composition, idempotency, recency,
and the dry-run guarantee. No network or real Threads credentials are touched —
ThreadsService is unconfigured in tests, which forces dry-run.
"""
from datetime import datetime, timedelta

import pytest

from src.config import settings
from src.models.podcast import Episode
from src.services import threads_publisher
from src.services.threads_service import THREADS_MAX_CHARS


def _now_ms() -> int:
    return int(datetime.utcnow().timestamp() * 1000)


def _ep(ep_id: str, *, title="本集重點", insights=None, tickers=None, released_ms=None) -> Episode:
    return Episode(
        id=ep_id,
        podcast_name="股癌",
        episode_title=title,
        key_insights=insights or [],
        related_tickers=tickers or [],
        created_time=released_ms or _now_ms(),
        released_at_ms=released_ms or _now_ms(),
        summary_image_public_url=f"https://cdn.tinboker.com/{ep_id}.png",
    )


@pytest.fixture
def temp_db(tmp_path, monkeypatch):
    """Point the SQLite store at a throwaway file so the ledger tests are isolated."""
    monkeypatch.setattr(settings, "database_path", str(tmp_path / "test.db"))
    yield


# ── compose_post ─────────────────────────────────────────────────────

def test_compose_post_includes_link_insights_and_hashtags():
    ep = _ep("EP200", insights=["台積電法說會優於預期", "AI 需求續強"], tickers=["2330", "NVDA"])
    draft = threads_publisher.compose_post(ep)

    assert draft["episode_id"] == "EP200"
    assert "tinboker.com/episode/EP200" in draft["text"]
    assert "台積電法說會優於預期" in draft["text"]
    assert "#2330" in draft["text"] and "#NVDA" in draft["text"]
    assert "#台股" in draft["text"]
    assert draft["image_url"] == "https://cdn.tinboker.com/EP200.png"


def test_compose_post_respects_500_char_limit():
    long_insights = ["這是一段很長的重點內容用來測試字數上限" * 10 for _ in range(8)]
    ep = _ep("EP201", insights=long_insights, tickers=["2330", "2317", "2454", "NVDA", "AAPL"])
    draft = threads_publisher.compose_post(ep)
    assert len(draft["text"]) <= THREADS_MAX_CHARS
    # Even when trimmed, the permalink must survive (it's the SEO/referral payload).
    assert "tinboker.com/episode/EP201" in draft["text"]


def test_compose_post_with_no_insights_falls_back_to_header():
    ep = _ep("EP202", title="只有標題", insights=[])
    draft = threads_publisher.compose_post(ep)
    assert "只有標題" in draft["text"]
    assert "tinboker.com/episode/EP202" in draft["text"]


# ── idempotency ledger ───────────────────────────────────────────────

def test_ledger_record_and_list(temp_db):
    assert threads_publisher.already_posted("EP300") is False
    threads_publisher._ensure_table()
    threads_publisher._record("EP300", "media_123", "https://tinboker.com/episode/EP300")
    assert threads_publisher.already_posted("EP300") is True
    posts = threads_publisher.list_posted()
    assert posts[0]["episode_id"] == "EP300"
    assert posts[0]["media_id"] == "media_123"


# ── publish_recent orchestration ─────────────────────────────────────

async def _fake_recent(episodes):
    async def _inner(*args, **kwargs):
        return episodes
    return _inner


@pytest.mark.asyncio
async def test_publish_recent_dry_run_when_unconfigured(temp_db, monkeypatch):
    eps = [_ep("EP400", insights=["重點一"]), _ep("EP401", insights=["重點二"])]
    monkeypatch.setattr(
        threads_publisher.podcast_service, "get_recent_episodes", await _fake_recent(eps)
    )
    # Credentials unset -> forced dry-run, nothing published or recorded.
    monkeypatch.setattr(settings, "threads_access_token", None)
    monkeypatch.setattr(settings, "threads_user_id", None)

    result = await threads_publisher.publish_recent(limit=10, dry_run=False)
    assert result["configured"] is False
    assert result["dry_run"] is True
    assert result["posted_count"] == 0
    assert {p["episode_id"] for p in result["posted"]} == {"EP400", "EP401"}
    assert threads_publisher.already_posted("EP400") is False  # dry-run never records


@pytest.mark.asyncio
async def test_publish_recent_skips_already_posted_and_old(temp_db, monkeypatch):
    old_ms = int((datetime.utcnow() - timedelta(days=30)).timestamp() * 1000)
    eps = [
        _ep("EP500", insights=["新"]),                       # fresh -> candidate
        _ep("EP501", insights=["舊"], released_ms=old_ms),   # too old -> skipped
        _ep("EP502", insights=[], title=""),                 # nothing to post -> skipped
    ]
    monkeypatch.setattr(
        threads_publisher.podcast_service, "get_recent_episodes", await _fake_recent(eps)
    )
    threads_publisher._ensure_table()
    threads_publisher._record("EP500", "m", "u")  # pretend already posted

    result = await threads_publisher.publish_recent(limit=10, dry_run=True, max_age_days=4)
    reasons = {s["episode_id"]: s["reason"] for s in result["skipped"]}
    assert reasons["EP500"] == "already_posted"
    assert reasons["EP501"] == "outside_recency_window"
    assert reasons["EP502"] == "no_postable_content"
    assert result["posted"] == []
