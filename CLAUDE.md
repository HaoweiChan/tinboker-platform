# tinboker-agents — Development Guide

## Repo overview

This monorepo uses **uv workspaces** to manage three Python packages:
- `services/podcast/` — podcast processing pipeline
- `services/knowledge_graph/` — news ingestion + entity extraction + wiki graph
- `libs/shared/` — shared utilities (secrets, GCS, config, wiki_builder)

The `wiki/` directory is a persistent markdown knowledge wiki written to by both services.

## Module map

| Path | Purpose | Entry point | Key files |
|------|---------|-------------|-----------|
| [services/podcast/](services/podcast/) | Download → transcribe → summarize → Firestore | [main.py](services/podcast/main.py) | [podcasts_to_download.json](services/podcast/podcasts_to_download.json) |
| [services/knowledge_graph/](services/knowledge_graph/) | News → entity extraction → wiki graph + SVG | [apps/cli/main.py](services/knowledge_graph/apps/cli/main.py) | [pipelines/](services/knowledge_graph/pipelines/) |
| [libs/shared/](libs/shared/) | Secrets, GCS, config, wiki_builder | N/A (library) | [src/shared/](libs/shared/src/shared/) |
| [wiki/](wiki/) | Persistent markdown knowledge wiki | (Git only) | [WIKI_SCHEMA.md](wiki/WIKI_SCHEMA.md) |

## Decision tree — which module to touch?

**Adding a new podcast source or tweaking download:**
- Modify [services/podcast/podcasts_to_download.json](services/podcast/podcasts_to_download.json)

**Tweaking summary/extraction prompts:**
- Content prompts: [services/podcast/src/podcast/content_builder/prompts/](services/podcast/src/podcast/content_builder/prompts/)
- KG prompts: [services/knowledge_graph/extract/llm/](services/knowledge_graph/extract/llm/)

**Adding entity extraction rules:**
- [services/knowledge_graph/extract/rules/](services/knowledge_graph/extract/rules/)
- [services/knowledge_graph/extract/llm/](services/knowledge_graph/extract/llm/)

**Updating wiki schema:**
- [wiki/WIKI_SCHEMA.md](wiki/WIKI_SCHEMA.md)
- Coordinate with both services if changing page structure

**Deploying to production:**
- See [docs/MIGRATION.md](docs/MIGRATION.md)
- podcast/ runs on Netcup VPS via systemd
- knowledge_graph/ runs on Google Cloud Run

## Conventions

**Dependencies:**
- Managed via uv workspaces; root `pyproject.toml` defines members
- Each service has its own `pyproject.toml`
- Shared library is a workspace dependency (`tinboker-shared`)
- Run `uv sync` from repo root to install all deps

**Testing:**
- Add tests in each module's `tests/` directory
- Run `pytest` from within the module directory, or use `uv run`
- Use mocks for external APIs (Spotify, Tavily, Gemini, Firestore, GCS)

**Commits:**
- Keep module changes atomic; PR per feature or fix
- No generated artifacts in commits (infographics, cache, logs)

**Code organization:**
- Podcast pipeline: `services/podcast/src/podcast/` — cli, orchestrator, firestore_reprocessor
- Podcast internals: `services/podcast/src/pipeline/`, `src/service/`, `src/summarize/`
- Content builder: `services/podcast/src/podcast/content_builder/` — LangGraph pipeline
- Knowledge graph: `services/knowledge_graph/` — apps/, pipelines/, services/, extract/, graph/
- Shared: `libs/shared/src/shared/` — secrets, gcs, config, wiki_builder

## Don't

- **Do not run `pip install` from repo root.** Use `uv sync` instead.
- **Do not put generated artifacts under git.** Infographics, cached articles, logs go in `.gitignore`.
- **Do not break the wiki/ schema.** Changes to page structure must be coordinated.
- **Do not bypass `secrets.bootstrap()`.** Always call it before reading env vars.

## Pipelines at a glance

### Podcast pipeline
```
Spotify RSS → services/podcast/download → transcribe → summarize
  → content_builder.run_pipeline() → markdown + slides
  → wiki_builder.ingest_episode() → wiki/episodes/
  → Upload MP3, transcript, summary → GCS + Firestore
```

### Knowledge-graph pipeline
```
Tavily news → services/knowledge_graph/agentic_pipeline → Gemini extraction
  → extract/llm or /rules → graph_service.build_graph()
  → WikiStore.upsert() → wiki/entities/, wiki/supply-chain/
  → Generate SVG infographics → GCS
```

## Related docs

- **[README.md](README.md)** — repo overview, architecture, quickstart
- **[docs/MIGRATION.md](docs/MIGRATION.md)** — production deployment runbook
