"""Compose and publish episode summaries to Threads.

This is the bridge between the agents' podcast ingestion pipeline and the brand's
Threads account. It reads recent episodes (Firestore, via ``podcast_service``),
composes a zh-TW post from the contract fields the agents pipeline writes
(``key_insights``, ``related_tickers``, ``episode_title``) plus a permalink back to
``{site_url}/episode/{id}``, and publishes it.

Two guards keep it safe to run on a schedule:
  * an idempotency table (one row per posted episode) so a re-run never double-posts;
  * a recency window so even a wiped idempotency store can only ever touch episodes
    from the last few days.

With no Threads credentials configured the run is forced to ``dry_run`` — it composes
and returns the drafts without publishing — so the endpoint is always safe to call.
"""

import logging
from datetime import datetime
from typing import Any, Optional

from src.config import settings
from src.database.db import get_connection
from src.services.podcast import PodcastService
from src.services.threads_service import THREADS_MAX_CHARS, ThreadsError, ThreadsService

logger = logging.getLogger(__name__)

podcast_service = PodcastService()

BRAND_HASHTAGS = ["台股", "投資理財", "財經"]
MAX_INSIGHTS = 3
MAX_TICKER_TAGS = 4


def _ensure_table() -> None:
    conn = get_connection()
    try:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS threads_posts (
                episode_id TEXT PRIMARY KEY,
                media_id   TEXT,
                url        TEXT,
                posted_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        conn.commit()
    finally:
        conn.close()


def _field(episode: Any, name: str, default=None):
    """Read a field from an Episode model or a plain dict interchangeably."""
    if isinstance(episode, dict):
        return episode.get(name, default)
    return getattr(episode, name, default)


def episode_url(episode_id: str) -> str:
    return f"{settings.site_url.rstrip('/')}/episode/{episode_id}"


def _hashtags(related_tickers: list[str]) -> str:
    tags = list(BRAND_HASHTAGS)
    for sym in (related_tickers or [])[:MAX_TICKER_TAGS]:
        sym = (sym or "").strip().replace(" ", "")
        if sym:
            tags.append(sym)
    return " ".join(f"#{t}" for t in tags)


def compose_post(episode: Any) -> dict:
    """Build a Threads post draft from an episode. Always <= THREADS_MAX_CHARS chars.

    Returns ``{episode_id, text, image_url, url}``.
    """
    episode_id = _field(episode, "id") or _field(episode, "episode_id") or ""
    title = (_field(episode, "episode_title") or "").strip()
    podcast_name = (_field(episode, "podcast_name") or "").strip()
    insights = [s.strip() for s in (_field(episode, "key_insights") or []) if s and s.strip()]
    tickers = _field(episode, "related_tickers") or []
    image_url = _field(episode, "summary_image_public_url") or None

    url = episode_url(episode_id)
    link_line = f"\n\n▶ 完整重點：{url}"
    tag_line = f"\n\n{_hashtags(tickers)}"

    header = "｜".join(p for p in (podcast_name, title) if p) or title or podcast_name

    # Fixed tail (link + hashtags) is reserved first; insights fill what remains.
    budget = THREADS_MAX_CHARS - len(link_line) - len(tag_line)
    body = header[:budget] if header else ""

    for insight in insights[:MAX_INSIGHTS]:
        candidate = f"{body}\n\n• {insight}" if body else f"• {insight}"
        if len(candidate) <= budget:
            body = candidate
        else:
            break

    if not body:
        # No header and no insight fit — fall back to a trimmed header/title.
        body = (header or title or podcast_name)[: max(0, budget - 1)].rstrip()

    text = f"{body}{tag_line}{link_line}"
    if len(text) > THREADS_MAX_CHARS:  # defensive; should not trigger given the budget
        text = text[: THREADS_MAX_CHARS - len(link_line)].rstrip() + link_line

    return {"episode_id": episode_id, "text": text, "image_url": image_url, "url": url}


def _release_ms(episode: Any) -> Optional[int]:
    return _field(episode, "released_at_ms") or _field(episode, "created_time")


def already_posted(episode_id: str) -> bool:
    _ensure_table()
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT 1 FROM threads_posts WHERE episode_id = ?", (episode_id,)
        ).fetchone()
        return row is not None
    finally:
        conn.close()


def _record(episode_id: str, media_id: str, url: str) -> None:
    conn = get_connection()
    try:
        conn.execute(
            "INSERT OR REPLACE INTO threads_posts (episode_id, media_id, url, posted_at) "
            "VALUES (?, ?, ?, ?)",
            (episode_id, media_id, url, datetime.utcnow().isoformat()),
        )
        conn.commit()
    finally:
        conn.close()


def list_posted(limit: int = 50) -> list[dict]:
    _ensure_table()
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT episode_id, media_id, url, posted_at FROM threads_posts "
            "ORDER BY posted_at DESC LIMIT ?",
            (limit,),
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


async def publish_recent(
    limit: int = 10,
    dry_run: bool = True,
    max_age_days: Optional[int] = None,
) -> dict:
    """Post any recent, not-yet-posted episodes to Threads.

    Returns a summary with the drafts that were (or would be) posted and the
    reasons others were skipped. Safe to call repeatedly; idempotent per episode.
    """
    _ensure_table()
    service = ThreadsService()
    configured = service.is_configured
    effective_dry_run = dry_run or not configured

    if max_age_days is None:
        max_age_days = settings.threads_max_age_days
    cutoff_ms: Optional[int] = None
    if max_age_days and max_age_days > 0:
        cutoff_ms = int((datetime.utcnow().timestamp() - max_age_days * 86400) * 1000)

    episodes = await podcast_service.get_recent_episodes(limit=limit, enrich_content=False)

    posted: list[dict] = []
    skipped: list[dict] = []

    for episode in episodes:
        episode_id = _field(episode, "id") or _field(episode, "episode_id") or ""
        if not episode_id:
            continue
        if already_posted(episode_id):
            skipped.append({"episode_id": episode_id, "reason": "already_posted"})
            continue
        rel_ms = _release_ms(episode)
        if cutoff_ms is not None and (rel_ms is None or rel_ms < cutoff_ms):
            skipped.append({"episode_id": episode_id, "reason": "outside_recency_window"})
            continue
        if not (_field(episode, "key_insights") or _field(episode, "episode_title")):
            skipped.append({"episode_id": episode_id, "reason": "no_postable_content"})
            continue

        draft = compose_post(episode)
        if effective_dry_run:
            posted.append({**draft, "dry_run": True})
            continue

        try:
            media_id = await service.publish(draft["text"], image_url=draft["image_url"])
            _record(episode_id, media_id, draft["url"])
            posted.append({**draft, "media_id": media_id, "dry_run": False})
            logger.info("Posted episode %s to Threads (%s)", episode_id, media_id)
        except ThreadsError as e:
            skipped.append({"episode_id": episode_id, "reason": f"publish_failed: {e}"})

    return {
        "configured": configured,
        "dry_run": effective_dry_run,
        "candidates": len(episodes),
        "posted_count": len([p for p in posted if not p.get("dry_run")]),
        "posted": posted,
        "skipped": skipped,
    }
