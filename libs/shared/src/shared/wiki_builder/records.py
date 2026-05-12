"""Render content data into :class:`WikiPage` records.

These functions know the *shape* of episode / entity / topic content (that
shape is content, not infra) but they emit plain ``WikiPage`` records — they no
longer touch the filesystem. Markdown is a *view* (see :mod:`.views`), not the
storage format.
"""

from __future__ import annotations

from typing import Any

from ..tickers import canonical_symbol
from .models import WikiPage
from .slugify import episode_slug, slugify, ticker_slug

_SENTIMENT_KEYS = ("bull", "bear", "neut")


def normalize_sentiment(value: Any) -> str:
    """Map a free-form sentiment label to ``'bull' | 'bear' | 'neut' | ''`` (unrecognized).

    Handles English ('bullish', 'positive', 'buy', …), Chinese (看多/看空/中性) and the short
    forms already used elsewhere ('bull'/'bear'/'neut').
    """
    s = str(value or "").strip().lower()
    if not s:
        return ""
    if "bull" in s or "多" in s or s in {"positive", "buy", "overweight", "long"}:
        return "bull"
    if "bear" in s or "空" in s or s in {"negative", "sell", "underweight", "short"}:
        return "bear"
    if "neut" in s or "中" in s or s in {"hold", "mixed", "flat"}:
        return "neut"
    return ""


def render_episode_page(
    podcast_name: str,
    episode_number: int | None,
    title: str,
    date: str,
    tickers: list[str],
    tags: list[str],
    summary_text: str,
    events_markdown: str | None,
    ticker_recommendations: dict[str, Any] | None,
    source_urls: dict[str, str] | None,
) -> WikiPage:
    slug = episode_slug(podcast_name, episode_number, title)

    frontmatter: dict[str, Any] = {"podcast": podcast_name}
    if episode_number is not None:
        frontmatter["episode_number"] = episode_number
    frontmatter["title"] = title
    frontmatter["date"] = date
    frontmatter["tickers"] = [str(t) for t in tickers]
    frontmatter["tags"] = [str(t) for t in tags]
    if source_urls:
        clean = {k: v for k, v in source_urls.items() if v}
        if clean:
            frontmatter["source_urls"] = clean

    lines: list[str] = [f"# {title}", ""]
    if summary_text:
        lines += [summary_text.strip(), ""]
    if events_markdown:
        lines += ["## Events Timeline", "", events_markdown.strip(), ""]

    recs = (ticker_recommendations or {}).get("ticker_recommendations", [])
    if recs:
        lines += [
            "## Ticker Recommendations",
            "",
            "| Ticker | Sentiment | Score | Time Horizon | Thesis |",
            "|--------|-----------|-------|--------------|--------|",
        ]
        for rec in recs:
            thesis = str(rec.get("bluf_thesis", "")).replace("|", "—")
            lines.append(
                f"| {rec.get('ticker', '')} | {rec.get('sentiment', '')} "
                f"| {rec.get('sentiment_score', '')} | {rec.get('time_horizon', '')} | {thesis} |"
            )
        lines.append("")

    # Structured per-ticker sentiment (canonical symbol -> bull|bear|neut) for the stats API.
    sentiment_map: dict[str, str] = {}
    for rec in recs:
        sym = rec.get("ticker")
        sent = normalize_sentiment(rec.get("sentiment", ""))
        if sym and sent:
            sentiment_map[canonical_symbol(str(sym))] = sent
    if sentiment_map:
        frontmatter["ticker_sentiment"] = sentiment_map

    related = [f"- [[entities/{ticker_slug(t)}]]" for t in tickers]
    related += [f"- [[topics/{slugify(tag)}]]" for tag in tags]
    if related:
        lines += ["## Related", "", *related, ""]

    return WikiPage(
        kind="episode", slug=slug, title=title, frontmatter=frontmatter, body="\n".join(lines)
    )


def render_entity_page(
    entity_id: str,
    name: str,
    entity_type: str,
    tickers: list[str],
    mentions: list[dict[str, str]] | None = None,
    ticker_history: list[dict[str, Any]] | None = None,
    supply_upstream: list[dict[str, str]] | None = None,
    supply_downstream: list[dict[str, str]] | None = None,
    market: str | None = None,
    sector: str | None = None,
) -> WikiPage:
    mentions = mentions or []
    ticker_history = ticker_history or []

    frontmatter: dict[str, Any] = {
        "id": entity_id,
        "name": name,
        "entity_type": entity_type,
        "tickers": [str(t) for t in tickers],
    }
    if market:
        frontmatter["market"] = market
    if sector:
        frontmatter["sector"] = sector

    lines: list[str] = [f"# {name}", ""]
    if mentions:
        lines += ["## Episode Mentions", ""]
        for m in mentions:
            lines.append(f"- [[{m.get('episode_link', '')}]] — {m.get('context', '')}")
        lines.append("")
    if supply_upstream or supply_downstream:
        lines += ["## Supply Chain", ""]
        for s in supply_upstream or []:
            lines.append(f"- Supplied by: [[entities/{s['slug']}]] — {s.get('rel', '')}")
        for s in supply_downstream or []:
            lines.append(f"- Supplies to: [[entities/{s['slug']}]] — {s.get('rel', '')}")
        lines.append("")
    if ticker_history:
        lines += [
            "## Ticker History",
            "",
            "| Date | Sentiment | Score | Thesis |",
            "|------|-----------|-------|--------|",
        ]
        for h in ticker_history:
            thesis = str(h.get("thesis", "")).replace("|", "—")
            cells = [h.get("date", ""), h.get("sentiment", ""), h.get("score", ""), thesis]
            lines.append("| " + " | ".join(str(c) for c in cells) + " |")
        lines.append("")

    return WikiPage(
        kind="entity", slug=entity_id, title=name, frontmatter=frontmatter, body="\n".join(lines)
    )


def render_topic_page(
    topic_id: str,
    name: str,
    episodes: list[dict[str, str]] | None = None,
    entities: list[str] | None = None,
) -> WikiPage:
    episodes = episodes or []
    entities = entities or []

    lines: list[str] = [f"# {name}", ""]
    if episodes:
        lines += ["## Episodes", ""]
        for ep in episodes:
            lines.append(f"- [[{ep['link']}]] — {ep.get('context', '')}")
        lines.append("")
    if entities:
        lines += ["## Related Entities", ""]
        for e in entities:
            lines.append(f"- [[entities/{e}]]")
        lines.append("")

    return WikiPage(
        kind="topic",
        slug=topic_id,
        title=name,
        frontmatter={"id": topic_id, "name": name},
        body="\n".join(lines),
    )


def render_supply_chain_page(entity_slug: str, entity_name: str) -> WikiPage:
    body = f"# {entity_name} — Supply Chain\n\n## Downstream (Customers)\n"
    return WikiPage(
        kind="supply_chain",
        slug=entity_slug,
        title=f"{entity_name} — Supply Chain",
        frontmatter={"entity": entity_slug},
        body=body,
    )
