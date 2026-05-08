# tinboker-agents — Full Migration & Deployment Runbook

This document is self-contained. You should never need to open another file to deploy
or migrate any service in this repo.

---

## Services overview

| Subdirectory | What it is | Where it runs |
|---|---|---|
| `knowledge-graph/` | LLM pipeline: news ingestion → Neo4j knowledge graph + SVG infographics | Google Cloud Run |
| `podcast/` | Podcast processing pipeline: download → transcribe → summarize → Firestore | Netcup VPS (152.53.136.182) |
| `content/` | LangGraph content generation pipeline (shared library) + Marp Flask service (Docker) | In-process (imported by podcast/) + Marp on VPS |

---

## Part 1 — GitHub repository setup

```bash
cd ~/Documents/tinboker/tinboker-agents
git init
git add .
git commit -m "chore: initial monorepo — knowledge-graph + podcast + content"
git remote add origin git@github.com:YOUR_USERNAME/tinboker-agents.git
git push -u origin main
git checkout -b develop && git push -u origin develop
```

Archive (do not delete yet) the three old repos once everything is verified:
`Graph-Builder-Agent`, `Podcast-Downloader`, `Content-Builder`.

---

## Part 2 — Critical fix: `podcast/` dependency on `content/`

**This must be done before running `pip install` in the podcast environment.**

`podcast/requirements.txt` currently pulls the Content-Builder package from GitHub:

```
git+https://github.com/Graphfolio/Content-Builder.git@dev#egg=content_builder
```

That GitHub repo will be archived. Replace that line with a local path reference:

```
# In podcast/requirements.txt — remove the git+ line and add:
-e ../content
```

This tells pip to install `content/` as an editable local package. It works because
both packages now live side-by-side in this monorepo.

Re-install on every machine/VPS where podcast runs after this change:

```bash
cd tinboker-agents/podcast
source .venv/bin/activate    # or python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

---

## Part 3 — `knowledge-graph/` — Google Cloud Run

### 3.1 What it does

Ingests financial news via Tavily → extracts entities and supply chain relationships
using Gemini Flash LLM + spaCy → stores in Neo4j → generates SVG infographics →
uploads articles and images to GCS.

Runs as a serverless Cloud Run job, not a persistent server.

### 3.2 Infrastructure

| Resource | Details |
|---|---|
| Compute | Google Cloud Run (serverless) |
| GCP project | `gen-lang-client-0901363254` |
| Region | `us-central1` |
| Cloud Run service | `graph-agent` |
| Container image | `gcr.io/gen-lang-client-0901363254/graph-agent` |
| Graph DB | Neo4j Aura (free tier) |
| Storage | GCS bucket `graphfolio-articles` |
| LLM | Google Gemini Flash (`GOOGLE_API_KEY`) |
| News search | Tavily API (`TAVILY_API_KEY`) |

### 3.3 Environment variables

Copy `knowledge-graph/.env.example` to `knowledge-graph/.env` and fill in:

```bash
PROJECT_ID=gen-lang-client-0901363254
GOOGLE_API_KEY=            # GCP Console → APIs & Services → Credentials → API key
NEO4J_URI=                 # Neo4j Aura console → Connection URI (starts neo4j+s://)
NEO4J_USER=neo4j           # always "neo4j" for Aura
NEO4J_PASSWORD=            # Neo4j Aura console → instance → Reset password if lost
TAVILY_API_KEY=            # https://tavily.com → dashboard → API key
API_TIER=free              # "free" enforces Gemini rate limits; set "paid" if billing enabled
```

### 3.4 Local run

```bash
cd knowledge-graph
python3 -m venv .venv && source .venv/bin/activate
pip install -e .
# Run a single ticker
python -m apps.cli.main generate-content --ticker NVDA
```

### 3.5 Deploy to Cloud Run (manual)

```bash
cd knowledge-graph
cp .env.example .env   # fill in values first
bash scripts/deploy_gcp.sh
```

The script:
1. Enables Cloud Run + Artifact Registry APIs
2. Builds container via `gcloud builds submit`
3. Deploys to `graph-agent` service in `us-central1`
4. Prompts for missing env vars if not in `.env`

### 3.6 Wire up CI/CD in the new repo (optional)

There is no existing workflow file for knowledge-graph. Add
`knowledge-graph/.github/workflows/deploy.yml`:

```yaml
name: Deploy knowledge-graph to Cloud Run

on:
  push:
    branches: [main]
    paths:
      - 'knowledge-graph/**'   # only trigger on knowledge-graph changes

env:
  GCP_PROJECT_ID: gen-lang-client-0901363254

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v4

      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2

      - name: Deploy to Cloud Run
        working-directory: knowledge-graph
        run: bash scripts/deploy_gcp.sh
        env:
          PROJECT_ID: ${{ env.GCP_PROJECT_ID }}
          NEO4J_URI: ${{ secrets.NEO4J_URI }}
          NEO4J_USER: neo4j
          NEO4J_PASSWORD: ${{ secrets.NEO4J_PASSWORD }}
          GOOGLE_API_KEY: ${{ secrets.GOOGLE_API_KEY }}
          TAVILY_API_KEY: ${{ secrets.TAVILY_API_KEY }}
          API_TIER: paid
```

GitHub repo secrets needed (Settings → Secrets → Actions):

| Secret | Where to get it |
|---|---|
| `GCP_SA_KEY` | GCP Console → IAM → Service Accounts → Keys → Add Key → JSON (full JSON content) |
| `NEO4J_URI` | Neo4j Aura Console → instance → Connection URI |
| `NEO4J_PASSWORD` | Neo4j Aura Console → instance → Password tab |
| `GOOGLE_API_KEY` | GCP Console → APIs & Services → Credentials |
| `TAVILY_API_KEY` | https://tavily.com |

### 3.7 Neo4j Aura — first-time setup

1. Go to https://console.neo4j.io → New Instance → Free tier
2. **Save the password when shown — you cannot retrieve it later**, only reset it
3. Copy the Connection URI (e.g. `neo4j+s://abc12345.databases.neo4j.io`)
4. Free tier: 200k nodes, 400k relationships, pauses after 3 days inactivity
   - Auto-resume is supported — the first request after pause takes ~30s

---

## Part 4 — `podcast/` — VPS service

### 4.1 What it does

1. Downloads podcast MP3 from Spotify RSS + metadata
2. Transcribes audio via AssemblyAI (primary) or Deepgram (fallback)
3. Sends transcript to `content/` (Content-Builder) for LLM summarization
4. Uploads MP3, transcript, summary, infographic to GCS
5. Writes episode metadata to Firestore
6. Exposes a FastAPI server for manual re-trigger of any step

### 4.2 Infrastructure

| Resource | Details |
|---|---|
| Compute | Netcup VPS — `152.53.136.182` |
| Port | `8003` (changed from 8002 to avoid conflict with backend-staging) |
| Process manager | systemd or tmux session |
| Python environment | `.venv` inside `podcast/` |
| Storage | GCS bucket `graphfolio-articles` + Firestore `graphfolio-db` |
| STT | AssemblyAI primary, Deepgram fallback |
| Summarization | Content-Builder (local `content/` package) |

### 4.3 VPS setup

SSH in: `ssh root@152.53.136.182`

```bash
# 1. Clone the monorepo (or pull if already cloned)
git clone git@github.com:YOUR_USERNAME/tinboker-agents.git ~/tinboker-agents
cd ~/tinboker-agents/podcast

# 2. Set up Python environment
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt   # now installs ../content locally

# 3. Configure GCP credentials for ADC (see 4.4 below — no .env needed)
```

### 4.4 Secrets — Google Secret Manager (no .env files)

As of 2026-05-09, `podcast/` no longer uses `.env` files. All secrets are
fetched from Google Secret Manager at process start by
[`podcast/src/secrets_bootstrap.py`](podcast/src/secrets_bootstrap.py).

**Secrets pulled from GSM** (project `gen-lang-client-0901363254`):

| Secret | Purpose |
| --- | --- |
| `PODCAST_API_KEY` | API auth — `X-API-Key` header |
| `GROQ_API_KEY` | Groq Whisper STT |
| `GOOGLE_API_KEY` | Gemini LLM (content generation via LangGraph) |
| `FIRESTORE_DATABASE_ID` | Firestore DB id |
| `GCP_CREDENTIALS_JSON` | Firestore + GCS auth |
| `SPOTIFY_ID` / `SPOTIFY_SECRET` | Optional metadata enrichment |
| `LANGSMITH_API_KEY` | LangSmith tracing (optional) |

**Non-secret deployment constants** (hardcoded in
[`podcast/configs/default.yaml`](podcast/configs/default.yaml) under `gcp:`):
`GCP_PROJECT_ID`, `GCS_BUCKET_NAME`.

**ADC (Application Default Credentials)** — required for the bootstrap to
authenticate against GSM:

```bash
# Drop the GCP service-account JSON onto the VPS
cp ~/gcp-sa-backup.json /root/tinboker-agents/podcast/gcp-service-account.json
chmod 600 /root/tinboker-agents/podcast/gcp-service-account.json

# Set GOOGLE_APPLICATION_CREDENTIALS in the systemd unit (see 4.6)
```

**IAM** — the service-account used for ADC needs the
`roles/secretmanager.secretAccessor` role on project
`gen-lang-client-0901363254`:

```bash
gcloud projects add-iam-policy-binding gen-lang-client-0901363254 \
  --member="serviceAccount:<sa-email>" \
  --role="roles/secretmanager.secretAccessor"
```

If a new secret is added to the pipeline, append the name to the
`_GSM_VARS` tuple in `podcast/src/secrets_bootstrap.py`. No deploy-config
changes required.

### 4.5 Start the API server

```bash
cd ~/tinboker-agents/podcast
source .venv/bin/activate
bash start_api.sh --port 8003
```

Or run in background with nohup:

```bash
nohup bash start_api.sh --port 8003 > ~/podcast-api.log 2>&1 &
```

### 4.6 Run as a systemd service (recommended for production)

Create `/etc/systemd/system/podcast-api.service`:

```ini
[Unit]
Description=Tinboker Podcast Downloader API
After=network.target

[Service]
Type=simple
WorkingDirectory=/root/tinboker-agents/podcast
ExecStart=/root/tinboker-agents/podcast/.venv/bin/uvicorn app:app --host 0.0.0.0 --port 8003
Restart=always
RestartSec=5
Environment=PORT=8003
Environment=GOOGLE_APPLICATION_CREDENTIALS=/root/tinboker-agents/podcast/gcp-service-account.json

[Install]
WantedBy=multi-user.target
```

```bash
systemctl daemon-reload
systemctl enable podcast-api
systemctl start podcast-api
systemctl status podcast-api
```

### 4.7 Port conflict note

The old `start_api.sh` defaulted to port `8002`, which is already used by
`backend-staging` on this VPS. The correct port is `8003`. The Caddy config and any
scripts calling the podcast API must use `8003`.

If exposing it publicly via a subdomain, add to `/etc/caddy/Caddyfile`:

```
podcast-api.tinboker.com {
    reverse_proxy localhost:8003
}
```

And add DNS: A record `podcast-api` → `152.53.136.182` (proxied) in Cloudflare.

---

## Part 5 — `content/` — LangGraph pipeline (shared library) + Marp Flask service

### 5.1 What it does

A Python package (`content-builder`) installed locally by `podcast/`. Receives a
transcript with sentence-level timestamps and runs a LangGraph StateGraph:

1. **Extractor**: Identify all topics/sections from sentences (Gemini structured output)
2. **Clusterer**: Filter financial events and attach sentence data
3. **Writer**: Generate Traditional Chinese markdown article (parallel)
4. **MARP Writer**: Generate presentation slides (parallel)
5. **Ticker Extractor**: Extract stock recommendations with sentiment (parallel)
6. **Converters**: Transform structured output to final markdown/Marp format

Returns: `markdown_report`, `events_markdown`, `marp_markdown`, `ticker_recommendations`, `ticker_marp_markdown`.

### 5.2 Package structure

```
content/
├── pyproject.toml                    # pip-installable package
├── src/content_builder/
│   ├── __init__.py                   # Entry point: run_pipeline(), build_graph()
│   ├── graph.py                      # LangGraph StateGraph definition
│   ├── state.py                      # TypedDict state schema
│   ├── llm.py                        # Model config + prompt loading
│   ├── observability.py              # LangSmith tracing setup
│   ├── nodes/                        # One module per graph node
│   │   ├── extractor.py
│   │   ├── clusterer.py
│   │   ├── writer.py
│   │   ├── markdown_transform.py
│   │   ├── events_markdown.py
│   │   ├── marp_writer.py
│   │   ├── marp_converter.py
│   │   └── ticker_extractor.py
│   └── prompts/                      # YAML prompt templates
│       ├── extractor.yaml
│       ├── writer.yaml
│       ├── marp_writer.yaml
│       └── ticker_extractor.yaml
├── dify_config/                      # Archived Dify YAML (reference only)
└── services/marp-flask-service/      # Marp PPTX converter (Docker)
```

### 5.3 Installation

```bash
# From podcast/ directory
pip install -e ../content
```

Or from anywhere in the monorepo:
```bash
pip install -e content/
```

### 5.4 Marp Flask service

The Marp service converts Marp-flavored markdown to PPTX. It runs as a standalone
Docker container on port 5004.

**Start / restart:**

```bash
cd ~/tinboker-agents/content
bash start_marp_service.sh
```

**Verify:**

```bash
curl http://localhost:5004/health
# → {"status": "ok"}
```

### 5.5 Environment variables for content/

The pipeline reads these from the process environment (set by podcast's
`secrets_bootstrap.py` or manually):

| Variable | Required | Purpose |
|---|---|---|
| `GOOGLE_API_KEY` | Yes | Gemini LLM calls |
| `LANGSMITH_API_KEY` | No | Enables LangSmith tracing |
| `EXTRACTOR_MODEL` | No | Override extractor model (default: gemini-2.5-flash) |
| `WRITER_MODEL` | No | Override writer model (default: gemini-2.5-flash) |
| `MARP_WRITER_MODEL` | No | Override marp writer model (default: gemini-2.5-flash) |
| `TICKER_EXTRACTOR_MODEL` | No | Override ticker extractor model (default: gemini-2.5-flash) |

---

## Part 6 — Verification checklist

- [x] `podcast/requirements.txt` no longer has `git+https://github.com/Graphfolio/Content-Builder.git`
- [ ] `pip install -r requirements.txt` in `podcast/` succeeds (installs `../content` locally)
- [ ] Podcast API health: `curl http://152.53.136.182:8003/health` → 200
- [ ] Marp service health: `curl http://localhost:5004/health` → `{"status":"ok"}`
- [ ] LangGraph pipeline test: `python -c "from content_builder import build_graph; print(build_graph())"`
- [ ] knowledge-graph Cloud Run service exists: `gcloud run services describe graph-agent --region us-central1`
- [ ] Running `python -m apps.cli.main generate-content --ticker AAPL` locally produces output
- [ ] Old Dify stack shut down on VPS
- [ ] Old repos archived on GitHub

---

## Useful commands

```bash
# ── knowledge-graph ──────────────────────────────────────────────
# Run pipeline locally for one ticker
cd knowledge-graph && python -m apps.cli.main generate-content --ticker TSMC

# View Cloud Run logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=graph-agent" \
  --project gen-lang-client-0901363254 --limit 50

# ── podcast ──────────────────────────────────────────────────────
# Check service status
systemctl status podcast-api

# Tail logs
journalctl -u podcast-api -f

# Re-run summarization for a specific episode via API
# Fetch PODCAST_API_KEY from GSM on demand (no .env file on disk).
curl -X POST http://localhost:8003/api/podcast/PODCAST_NAME/episodes/EPISODE_ID/rerun-summarize \
  -H "X-API-Key: $(gcloud secrets versions access latest --secret=PODCAST_API_KEY --project=gen-lang-client-0901363254)"

# ── content/LangGraph ─────────────────────────────────────────────
# Test the pipeline locally
cd ~/tinboker-agents && python -c "from content_builder import build_graph; print(build_graph().get_graph().nodes)"

# Restart Marp service
cd ~/tinboker-agents/content && bash start_marp_service.sh

# Test Marp conversion
curl -X POST http://localhost:5004/convert \
  -H "Content-Type: application/json" \
  -d '{"markdown": "---\n# Test Slide\n---\nHello"}'
```

---

## Port reference

| Service | VPS Port | Notes |
|---|---|---|
| Podcast API | 8003 | Changed from 8002 (conflict with backend-staging) |
| Marp Flask | 5004 | Docker container on Dify network |
| knowledge-graph | N/A | Cloud Run HTTPS (no fixed port) |
