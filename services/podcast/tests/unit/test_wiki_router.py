"""Tests for the /api/wiki FastAPI routes (in-memory repository)."""

import sys
from pathlib import Path

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from shared.wiki_builder import InMemoryWikiRepository, ingest_episode  # noqa: E402
from src.routers import wiki  # noqa: E402

API_KEY = "test-wiki-key"


@pytest.fixture()
def client(monkeypatch):
    monkeypatch.setenv("PODCAST_API_KEY", API_KEY)
    repo = InMemoryWikiRepository()
    app = FastAPI()
    app.include_router(wiki.router)
    app.dependency_overrides[wiki.get_repo] = lambda: repo
    return TestClient(app), repo


def _auth():
    return {"X-API-Key": API_KEY}


def test_health(client):
    c, _ = client
    assert c.get("/api/wiki/health").json()["status"] == "healthy"


def test_upsert_get_delete_page(client):
    c, _ = client
    body = {
        "title": "Ep 1",
        "frontmatter": {"tickers": ["TSM"], "date": "2026-05-12"},
        "body": "# Ep 1\n\n## Related\n\n- [[entities/tsm]] — chips\n",
    }
    r = c.put("/api/wiki/pages/episode/p_ep1", json=body, headers=_auth())
    assert r.status_code == 200
    out = r.json()
    assert out["kind"] == "episode" and out["slug"] == "p_ep1" and out["created_at"]

    got = c.get("/api/wiki/pages/episode/p_ep1").json()
    assert got["title"] == "Ep 1" and got["frontmatter"]["tickers"] == ["TSM"]

    md = c.get("/api/wiki/pages/episode/p_ep1.md")
    assert md.headers["content-type"].startswith("text/markdown")
    assert "type: episode" in md.text and "# Ep 1" in md.text

    assert c.get("/api/wiki/pages/episode/missing").status_code == 404

    listed = c.get("/api/wiki/pages", params={"kind": "episode"}).json()
    assert listed["count"] == 1 and listed["pages"][0]["slug"] == "p_ep1"
    filtered = c.get("/api/wiki/pages", params={"q": "tickers:TSM"}).json()
    assert filtered["count"] == 1

    links = c.get("/api/wiki/links", params={"src_kind": "episode", "src_slug": "p_ep1"}).json()
    assert links["links"][0]["dst_slug"] == "tsm" and links["links"][0]["context"] == "chips"

    assert c.delete("/api/wiki/pages/episode/p_ep1", headers=_auth()).json() == {"deleted": True}
    assert c.get("/api/wiki/pages/episode/p_ep1").status_code == 404


def test_write_routes_require_api_key(client):
    c, _ = client
    assert c.put("/api/wiki/pages/episode/x", json={"body": "x"}).status_code == 401
    assert c.put(
        "/api/wiki/pages/episode/x", json={"body": "x"}, headers={"X-API-Key": "wrong"}
    ).status_code == 401
    assert c.delete("/api/wiki/pages/episode/x").status_code == 401
    ingest = c.post("/api/wiki/ingest/episode", json={"podcast_name": "p", "title": "t"})
    assert ingest.status_code == 401


def test_index_and_ingest_episode(client):
    c, repo = client
    r = c.post(
        "/api/wiki/ingest/episode",
        json={
            "podcast_name": "Pod",
            "episode_number": 3,
            "title": "Ep 3",
            "date": "2026-05-12",
            "tickers": ["NVDA"],
            "tags": ["ai"],
            "summary_text": "s",
        },
        headers=_auth(),
    )
    assert r.json() == {"episode_kind": "episode", "episode_slug": "pod_ep3"}
    assert {(p.kind, p.slug) for p in repo.list_pages()} == {
        ("episode", "pod_ep3"),
        ("entity", "nvda"),
        ("topic", "ai"),
    }
    idx_json = c.get("/api/wiki/index").json()
    assert idx_json["episode"][0]["slug"] == "pod_ep3"
    idx_md = c.get("/api/wiki/index", params={"format": "md"})
    assert idx_md.headers["content-type"].startswith("text/markdown")
    assert "1 episodes" in idx_md.text


def test_stats_routes(client):
    c, repo = client
    ingest_episode(
        podcast_name="股癌", episode_number=1, title="E1", date="2026-05-12",
        tickers=["2330.TW", "NVDA"], tags=["半導體"], summary_text="s",
        ticker_recommendations={
            "ticker_recommendations": [
                {"ticker": "2330.TW", "sentiment": "bullish"},
                {"ticker": "NVDA", "sentiment": "bull"},
            ]
        },
        repository=repo,
    )
    ingest_episode(
        podcast_name="財報狗", episode_number=2, title="E2", date="2026-05-12",
        tickers=["NVDA"], tags=["半導體"], summary_text="s",
        ticker_recommendations={
            "ticker_recommendations": [{"ticker": "NVDA", "sentiment": "bullish"}]
        },
        repository=repo,
    )

    tt = c.get("/api/wiki/stats/top-tickers", params={"days": 30}).json()
    assert tt["window_days"] == 30 and {t["sym"] for t in tt["tickers"]} >= {"2330", "NVDA"}
    nvda = next(t for t in tt["tickers"] if t["sym"] == "NVDA")
    assert nvda["name"] == "輝達" and nvda["mentions"] == 2 and nvda["dist"]["bull"] == 2

    ts = c.get("/api/wiki/stats/top-shows", params={"days": 30}).json()
    assert {s["podcast"] for s in ts["shows"]} == {"股癌", "財報狗"}

    tp = c.get("/api/wiki/stats/topics").json()
    assert any(t["tag"] == "半導體" and t["count"] == 2 for t in tp["topics"])

    pulse = c.get("/api/wiki/stats/pulse").json()
    assert pulse["date"] == "2026-05-12" and pulse["episode_count"] == 2
    assert pulse["ticker_count"] == 2 and "dominant" in pulse["sentiment"]

    dash = c.get("/api/wiki/stats/dashboard", params={"days": 30}).json()
    assert set(dash) == {"window_days", "pulse", "top_tickers", "top_shows", "topics"}

    ent = c.get("/api/wiki/stats/entity/nvda").json()
    assert ent["name"] == "輝達" and ent["total_mentions"] == 2
    assert ent["last_mentioned_at"] == "2026-05-12"
    assert c.get("/api/wiki/stats/entity/zzzz").status_code == 404
    bad_date = c.get("/api/wiki/stats/pulse", params={"date": "not-a-date"})
    assert bad_date.status_code == 422
