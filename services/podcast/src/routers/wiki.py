"""Wiki content API — read/write the Postgres-backed knowledge wiki.

The podcast pipeline (running on the same box as Postgres) writes through the
``WikiRepository`` directly; this HTTP surface is for external readers, a future
UI, and the knowledge-graph service. Write/destructive routes require X-API-Key
(same as the rest of the podcast API); reads are open.
"""

from __future__ import annotations

from datetime import date, datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from pydantic import BaseModel, Field
from shared.wiki_builder import (
    WikiPage,
    build_index_markdown,
    get_repository,
    ingest_episode,
    page_to_markdown,
    stats,
)
from shared.wiki_builder.repository import WikiRepository

from ..auth import verify_api_key

router = APIRouter(prefix="/api/wiki", tags=["wiki"])

_repository: WikiRepository | None = None


def get_repo() -> WikiRepository:
    """FastAPI dependency: the process-wide wiki repository.

    Tests override this via ``app.dependency_overrides[get_repo]``.
    """
    global _repository
    if _repository is None:
        _repository = get_repository()
    return _repository


# --- schemas -------------------------------------------------------------
class WikiPageIn(BaseModel):
    title: str = ""
    frontmatter: dict[str, Any] = Field(default_factory=dict)
    body: str = ""


class WikiPageOut(WikiPageIn):
    kind: str
    slug: str
    created_at: datetime | None = None
    updated_at: datetime | None = None

    @classmethod
    def from_page(cls, page: WikiPage) -> "WikiPageOut":
        return cls(
            kind=page.kind,
            slug=page.slug,
            title=page.title,
            frontmatter=page.frontmatter,
            body=page.body,
            created_at=page.created_at,
            updated_at=page.updated_at,
        )


class WikiLinkOut(BaseModel):
    src_kind: str
    src_slug: str
    dst_kind: str
    dst_slug: str
    context: str = ""


class EpisodeIngestIn(BaseModel):
    podcast_name: str
    episode_number: int | None = None
    title: str
    date: str | None = None
    tickers: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    summary_text: str = ""
    events_markdown: str | None = None
    ticker_recommendations: dict[str, Any] | None = None
    source_urls: dict[str, str] | None = None


def _parse_frontmatter_query(q: str | None) -> dict[str, Any] | None:
    if not q:
        return None
    out: dict[str, Any] = {}
    for part in q.split(","):
        if ":" in part:
            key, value = part.split(":", 1)
            key = key.strip()
            if key:
                out[key] = value.strip()
    return out or None


# --- routes (static paths before /pages/{kind}/{slug}) -------------------
@router.get("/health")
async def wiki_health(repo: WikiRepository = Depends(get_repo)) -> dict:
    return repo.health()


@router.get("/pages")
async def list_wiki_pages(
    kind: str | None = Query(None),
    q: str | None = Query(None, description="frontmatter filter, e.g. 'tickers:TSM'"),
    limit: int = Query(200, ge=1, le=2000),
    offset: int = Query(0, ge=0),
    repo: WikiRepository = Depends(get_repo),
) -> dict:
    pages = repo.list_pages(
        kind=kind, frontmatter_filter=_parse_frontmatter_query(q), limit=limit, offset=offset
    )
    return {"count": len(pages), "pages": [WikiPageOut.from_page(p).model_dump() for p in pages]}


@router.get("/index")
async def wiki_index(
    format: str = Query("json", pattern="^(json|md)$"),
    repo: WikiRepository = Depends(get_repo),
) -> Any:
    pages = repo.list_pages(limit=100000)
    if format == "md":
        return Response(build_index_markdown(pages), media_type="text/markdown; charset=utf-8")
    by_kind: dict[str, list[dict[str, Any]]] = {}
    for p in pages:
        by_kind.setdefault(p.kind, []).append(
            {"slug": p.slug, "title": p.title, "frontmatter": p.frontmatter}
        )
    return by_kind


@router.get("/links")
async def list_wiki_links(
    src_kind: str | None = None,
    src_slug: str | None = None,
    dst_kind: str | None = None,
    dst_slug: str | None = None,
    repo: WikiRepository = Depends(get_repo),
) -> dict:
    src = (src_kind, src_slug) if src_kind and src_slug else None
    dst = (dst_kind, dst_slug) if dst_kind and dst_slug else None
    links = repo.list_links(src=src, dst=dst)
    return {"links": [WikiLinkOut(**link.to_dict()).model_dump() for link in links]}


@router.post("/ingest/episode", dependencies=[Depends(verify_api_key)])
async def ingest_episode_route(
    payload: EpisodeIngestIn, repo: WikiRepository = Depends(get_repo)
) -> dict:
    page = ingest_episode(repository=repo, **payload.model_dump())
    return {"episode_kind": page.kind, "episode_slug": page.slug}


# --- stats / aggregates (content-derived; for the platform webui's dashboards) ---
def _parse_as_of(value: str | None) -> date | None:
    if not value:
        return None
    try:
        return date.fromisoformat(value)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=f"invalid date: {value}") from exc


@router.get("/stats/top-tickers")
async def stats_top_tickers(
    days: int = Query(7, ge=1, le=365),
    limit: int = Query(10, ge=1, le=100),
    repo: WikiRepository = Depends(get_repo),
) -> dict:
    return {"window_days": days, "tickers": stats.top_tickers(repo, days=days, limit=limit)}


@router.get("/stats/top-shows")
async def stats_top_shows(
    days: int = Query(7, ge=1, le=365),
    limit: int = Query(10, ge=1, le=100),
    repo: WikiRepository = Depends(get_repo),
) -> dict:
    return {"window_days": days, "shows": stats.top_shows(repo, days=days, limit=limit)}


@router.get("/stats/topics")
async def stats_topics(
    days: int | None = Query(None, ge=1, le=365, description="omit for all-time"),
    limit: int = Query(20, ge=1, le=200),
    repo: WikiRepository = Depends(get_repo),
) -> dict:
    return {"window_days": days, "topics": stats.topics(repo, days=days, limit=limit)}


@router.get("/stats/pulse")
async def stats_pulse(
    on_date: str | None = Query(
        None, alias="date", description="YYYY-MM-DD; omit for the latest episode day"
    ),
    repo: WikiRepository = Depends(get_repo),
) -> dict:
    return stats.pulse(repo, on_date=_parse_as_of(on_date))


@router.get("/stats/dashboard")
async def stats_dashboard(
    days: int = Query(7, ge=1, le=365),
    repo: WikiRepository = Depends(get_repo),
) -> dict:
    return {
        "window_days": days,
        "pulse": stats.pulse(repo),
        "top_tickers": stats.top_tickers(repo, days=days, limit=8),
        "top_shows": stats.top_shows(repo, days=days, limit=6),
        "topics": stats.topics(repo, days=None, limit=20),
    }


@router.get("/stats/entity/{slug}")
async def stats_entity(
    slug: str,
    days: int | None = Query(None, ge=1, le=3650),
    repo: WikiRepository = Depends(get_repo),
) -> dict:
    agg = stats.entity_aggregate(repo, slug, days=days)
    if agg is None:
        raise HTTPException(status_code=404, detail=f"entity/{slug} not found")
    return agg


# NOTE: the `.md` route must precede `/pages/{kind}/{slug}` so the suffix matches.
@router.get("/pages/{kind}/{slug}.md")
async def get_wiki_page_markdown(
    kind: str, slug: str, repo: WikiRepository = Depends(get_repo)
) -> Response:
    page = repo.get_page(kind, slug)
    if page is None:
        raise HTTPException(status_code=404, detail=f"{kind}/{slug} not found")
    return Response(page_to_markdown(page), media_type="text/markdown; charset=utf-8")


@router.get("/pages/{kind}/{slug}")
async def get_wiki_page(
    kind: str, slug: str, repo: WikiRepository = Depends(get_repo)
) -> WikiPageOut:
    page = repo.get_page(kind, slug)
    if page is None:
        raise HTTPException(status_code=404, detail=f"{kind}/{slug} not found")
    return WikiPageOut.from_page(page)


@router.put("/pages/{kind}/{slug}", dependencies=[Depends(verify_api_key)])
async def upsert_wiki_page(
    kind: str, slug: str, body: WikiPageIn, repo: WikiRepository = Depends(get_repo)
) -> WikiPageOut:
    page = repo.upsert_page(
        WikiPage(
            kind=kind, slug=slug, title=body.title, frontmatter=body.frontmatter, body=body.body
        )
    )
    return WikiPageOut.from_page(page)


@router.delete("/pages/{kind}/{slug}", dependencies=[Depends(verify_api_key)])
async def delete_wiki_page(
    kind: str, slug: str, repo: WikiRepository = Depends(get_repo)
) -> dict:
    return {"deleted": repo.delete_page(kind, slug)}
