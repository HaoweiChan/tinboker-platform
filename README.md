# tinboker-agents

Unified monorepo for financial content infrastructure: podcast processing, knowledge graph construction, and a persistent markdown wiki.

## Quickstart

```bash
# Install uv (if not already installed)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Sync all workspace dependencies
uv sync

# Run podcast pipeline
cd services/podcast && python main.py --config podcasts_to_download.json

# Run knowledge-graph pipeline
cd services/knowledge_graph && python -m apps.cli.main search-agent --ticker TSLA
```

## Repository Structure

```
tinboker-agents/
├── pyproject.toml                    # uv workspace root
├── README.md
├── CLAUDE.md                         # agent development guide
├── docs/
│   └── MIGRATION.md                  # deployment runbook
├── libs/
│   └── shared/                       # shared library (secrets, GCS, wiki_builder)
│       ├── pyproject.toml
│       ├── src/shared/
│       │   ├── secrets.py            # unified GSM + dotenv bootstrap
│       │   ├── gcs.py                # GCS client factory
│       │   ├── config.py             # YAML + env config loading
│       │   └── wiki_builder/         # shared wiki writing interface
│       └── tests/
├── services/
│   ├── podcast/                      # podcast download → transcribe → summarize → upload
│   │   ├── pyproject.toml
│   │   ├── main.py                   # entry point
│   │   ├── podcasts_to_download.json
│   │   ├── src/
│   │   │   ├── podcast/
│   │   │   │   ├── cli.py            # argparse CLI
│   │   │   │   ├── orchestrator.py   # pipeline coordination
│   │   │   │   ├── firestore_reprocessor.py
│   │   │   │   ├── content_builder/  # absorbed from content/
│   │   │   │   └── marp_service/     # Marp Flask converter
│   │   │   ├── pipeline/             # step-based episode processor
│   │   │   ├── service/              # download, GCS, Firebase services
│   │   │   ├── summarize/            # summary generation
│   │   │   ├── wiki_builder/         # wiki ingestion (local copy)
│   │   │   └── models/               # data models
│   │   └── tests/
│   └── knowledge_graph/              # news → entity extraction → wiki graph
│       ├── pyproject.toml
│       ├── Dockerfile
│       ├── apps/cli/                 # typer CLI
│       ├── pipelines/                # agentic + content gen pipelines
│       ├── services/                 # graph, extraction, ingestion services
│       ├── extract/                  # rule-based + LLM extraction
│       ├── graph/                    # wiki-backed graph store
│       ├── mcp/                      # MCP server tools
│       └── tests/
└── wiki/                             # persistent markdown knowledge wiki
    ├── WIKI_SCHEMA.md
    ├── episodes/
    ├── entities/
    ├── topics/
    └── supply-chain/
```

## Architecture

### Data Flow

```
                    ┌─────────────┐
                    │  Spotify RSS │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   podcast/  │
                    │  download → │
                    │ transcribe →│
                    │ summarize → │
                    │   upload    │
                    └──────┬──────┘
                           │ writes episodes
                           ▼
              ┌────────────────────────┐
              │        wiki/           │
              │  episodes/ entities/   │
              │  topics/ supply-chain/ │
              └────────────────────────┘
                           ▲
                           │ writes entities + edges
                    ┌──────┴──────┐
                    │ knowledge_  │
                    │   graph/    │
                    │  Tavily  →  │
                    │  extract →  │
                    │  graph   →  │
                    │  visualize  │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ Tavily News │
                    └─────────────┘
```

### Shared Concerns

| Concern | Implementation |
|---------|---------------|
| Secrets | `libs/shared/secrets.py` — GSM + dotenv |
| GCS | `libs/shared/gcs.py` — client factory |
| Wiki writes | `libs/shared/wiki_builder/` — unified interface |
| Config | `libs/shared/config.py` — YAML + env |

### Deployment Targets

| Service | Platform | Details |
|---------|----------|---------|
| podcast/ | Netcup VPS | systemd unit, port 8003 |
| knowledge_graph/ | Google Cloud Run | Docker, triggered by GH Actions |
| wiki/ | Git-backed | Push to merge |
| marp_service/ | Docker (co-deployed with podcast) | Flask, port 5004 |

## Development

Each workspace member has its own virtual environment managed by uv:

```bash
# Install deps for a specific service
uv sync --package tinboker-podcast

# Run tests for a service
uv run --package tinboker-podcast pytest

# Run tests for shared lib
uv run --package tinboker-shared pytest
```

## Related Docs

- [CLAUDE.md](CLAUDE.md) — agent development guide
- [docs/MIGRATION.md](docs/MIGRATION.md) — production deployment runbook
- [wiki/WIKI_SCHEMA.md](wiki/WIKI_SCHEMA.md) — wiki page schema
