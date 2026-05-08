# tinboker-platform — Full Migration & Deployment Runbook

This document is self-contained. You should never need to open another file to deploy
this repo from scratch or migrate from the old separate repos.

---

## Architecture

```
Users → Cloudflare Edge (cache + DDoS) → Netcup VPS (152.53.136.182)
                                              ↓
                                         Caddy (reverse proxy + auto-HTTPS)
                                              ↓
                              ┌───────────────┼───────────────┐
                           :8000           :8001           :8002
                          backend-        backend-        backend-
                           prod            dev            staging
                              └───────────────┼───────────────┘
                                         Redis :6379
                                              ↓
                                   Firestore (graphfolio-db)
                                   GCS (graphfolio-articles)
                                   PostgreSQL (podcast_db, read-only)
                                   GCP Secret Manager
```

**Frontend:** Cloudflare Pages → `tinboker.com`, `dev.tinboker.com` (preview)
**Backend:** Docker containers on VPS → `api.tinboker.com` (prod), `dev-api.tinboker.com`, `staging-api.tinboker.com`

---

## Part 1 — One-time infrastructure (skip if already done)

### 1.1 VPS access

```
Host:  152.53.136.182   (Netcup RS 1000 G11, Debian 13, Germany)
User:  root
```

SSH in: `ssh root@152.53.136.182`

If setting up a fresh VPS, run this first:

```bash
# Firewall
apt install -y ufw fail2ban
ufw allow ssh
ufw allow http
ufw allow https
ufw enable

# Docker
curl -fsSL https://get.docker.com | sh

# Caddy
apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudflare.com/public-key/caddy-stable.gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudflare.com/public-key/caddy-stable.list' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update && apt install -y caddy
```

### 1.2 Caddy configuration

Write `/etc/caddy/Caddyfile`:

```
api.tinboker.com {
    encode gzip
    reverse_proxy localhost:8000
}

dev-api.tinboker.com {
    encode gzip
    reverse_proxy localhost:8001
}

staging-api.tinboker.com {
    encode gzip
    reverse_proxy localhost:8002
}

dev.tinboker.com {
    encode gzip
    handle /api/* {
        reverse_proxy localhost:8001
    }
    handle {
        root * /var/www/html-dev
        try_files {path} /index.html
        file_server
    }
}
```

Then reload: `systemctl reload caddy`

Caddy issues Let's Encrypt certs automatically — no cert setup required.

### 1.3 Cloudflare DNS records

In Cloudflare dashboard → DNS for `tinboker.com`:

| Type | Name | Content | Proxy |
|---|---|---|---|
| A | `api` | `152.53.136.182` | Proxied (orange) |
| A | `dev-api` | `152.53.136.182` | Proxied |
| A | `staging-api` | `152.53.136.182` | Proxied |
| A | `dev` | `152.53.136.182` | Proxied |
| CNAME | `@` (root) | `tinboker-platform.pages.dev` | Proxied |
| CNAME | `www` | `tinboker-platform.pages.dev` | Proxied |

SSL/TLS mode: **Full** (not Full Strict — Caddy uses Let's Encrypt, not Cloudflare origin cert)

### 1.4 Cloudflare cache rule

Dashboard → `tinboker.com` → Rules → Cache Rules → Create rule:

```
Name: Cache API GET responses
When: (starts_with(http.request.uri.path, "/api/") and http.request.method eq "GET")
Cache eligibility: Eligible for cache
Edge TTL: Use cache-control header
Browser TTL: Override — 1 hour
```

### 1.5 Docker shared network

The backend containers join a shared network with the external PostgreSQL container:

```bash
ssh root@152.53.136.182
docker network create app_default 2>/dev/null || true
```

---

## Part 2 — GCP setup

### 2.1 Service account

The backend authenticates to GCP using a service account JSON key mounted into the
Docker container at `/app/gcp-service-account.json`.

- **GCP project:** `gen-lang-client-0901363254`
- **Key file on VPS:** `/app/backend/gcp-service-account.json` (not committed to git)

To get a new key if lost:
1. GCP Console → IAM & Admin → Service Accounts
2. Find the service account used by the backend
3. Keys tab → Add Key → JSON → download
4. Upload to VPS: `scp service-account-key.json root@152.53.136.182:/app/backend/gcp-service-account.json`

### 2.2 GCP Secret Manager — full secrets list

The backend fetches these secrets from Secret Manager **at runtime** (loaded by
`GCPSecretManagerSource` in `src/config_loader.py`). Secret name = uppercase of the
Python settings field name.

| Secret name in GSM | What it is | Required? |
|---|---|---|
| `POSTGRES_PASSWORD` | Password for Cloud SQL (podcast_db) | Yes (prod) |
| `JWT_SECRET_KEY` | Signing key for user auth tokens | Yes |
| `ADMIN_PASSWORD` | Password for admin UI login | Yes |
| `ADMIN_JWT_SECRET` | Signing key for admin tokens | Yes |
| `ADMIN_EMAILS` | Comma-separated admin email addresses | Yes |
| `FINMIND_API_KEY` | FinMind Taiwan stock data API | Yes |
| `MASSIVE_API_KEY` | Massive API (US market data) | Yes |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token (cache purge) | Optional |
| `CLOUDFLARE_ZONE_TAG` | Cloudflare zone ID for tinboker.com | Optional |

**Setting a secret:**

```bash
# Create new
echo -n "your-secret-value" | gcloud secrets create SECRET_NAME \
  --data-file=- --project=gen-lang-client-0901363254

# Update existing
echo -n "your-secret-value" | gcloud secrets versions add SECRET_NAME \
  --data-file=- --project=gen-lang-client-0901363254
```

### 2.3 GCP secrets used by GitHub Actions CI (stored in Secret Manager, not as GH secrets)

These are fetched by the workflow via `gcloud secrets versions access`:

| Secret name in GSM | Used for |
|---|---|
| `VPS_HOST` | SSH target (`152.53.136.182`) |
| `VPS_USER` | SSH user (`root`) |
| `VPS_SSH_KEY` | SSH private key for deploy |
| `GHCR_TOKEN` | GitHub Container Registry login token |
| `GOOGLE_CLIENT_ID` | Injected as `VITE_GOOGLE_CLIENT_ID` at frontend build time |

These are all already populated from the previous repo — no changes needed.

---

## Part 3 — GitHub repository setup

### 3.1 Create the repo

```bash
cd ~/Documents/tinboker/tinboker-platform
git init
git add .
git commit -m "chore: initial monorepo — frontend + backend + specs"
git remote add origin git@github.com:YOUR_USERNAME/tinboker-platform.git
git push -u origin main
git checkout -b develop && git push -u origin develop
```

### 3.2 GitHub Actions secrets (stored directly in repo settings)

Settings → Secrets and variables → Actions → New repository secret:

| Secret | Where to get it |
|---|---|
| `GCP_SA_KEY` | GCP Console → IAM → Service Accounts → your SA → Keys → Add Key → JSON. Paste the entire JSON content. |
| `CLOUDFLARE_API_TOKEN` | Cloudflare → My Profile → API Tokens → Create Token → "Edit Cloudflare Workers" template, scoped to tinboker.com |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare dashboard → right sidebar when on tinboker.com overview |

> `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `GHCR_TOKEN` are **not** stored as GitHub secrets —
> they are fetched from GCP Secret Manager at workflow runtime using `GCP_SA_KEY`.

---

## Part 4 — Update workflow files for monorepo layout

The old repos had each workflow run at the repo root. Now `frontend/` and `backend/` are
subdirectories. Three files need editing.

### 4.1 `backend/.github/workflows/deploy.yml`

**Change 1** — image name (line near top of file):
```yaml
# Before
IMAGE_NAME: graphfolio/graphfolio-backend

# After
IMAGE_NAME: YOUR_USERNAME/tinboker-backend
```

**Change 2** — the VPS SSH deploy script block. Find the `script:` section inside
`Deploy to VPS` step. Add `cd backend` after the git reset:

```yaml
script: |
  cd /app
  git fetch origin
  git reset --hard origin/${{ github.ref_name }}
  git clean -fd

  cd /app/backend                    # ← ADD THIS LINE

  echo "$GHCR_TOKEN" | docker login ghcr.io -u YOUR_USERNAME --password-stdin

  ${{ steps.env.outputs.image_var }}=${{ steps.env.outputs.image_tag }} \
    docker compose -f docker-compose.multi.yml pull ${{ steps.env.outputs.service }}

  docker compose -f docker-compose.multi.yml up -d redis netdata
  sleep 5

  ${{ steps.env.outputs.image_var }}=${{ steps.env.outputs.image_tag }} \
    docker compose -f docker-compose.multi.yml up -d --no-deps ${{ steps.env.outputs.service }}

  docker image prune -f
  sleep 15
  curl -f http://localhost:${{ steps.env.outputs.port }}/health || exit 1
```

**Change 3** — PR comment body (find `ghcr.io/graphfolio/graphfolio-backend`):
```yaml
# Before
const imageName = 'ghcr.io/graphfolio/graphfolio-backend:' + imageTag;

# After
const imageName = 'ghcr.io/YOUR_USERNAME/tinboker-backend:' + imageTag;
```

### 4.2 `backend/.github/workflows/deploy-admin.yml`

Same two changes:
- `IMAGE_NAME: graphfolio/graphfolio-backend` → `YOUR_USERNAME/tinboker-backend`
- Every `cd /app` in the SSH script block → `cd /app/backend`

### 4.3 `backend/.github/workflows/health-check.yml`

No path changes needed. The file only does external health checks against public URLs.
If the auto-restart SSH block references `cd /app`, add `cd /app/backend` before the
`docker compose` commands there too.

### 4.4 `backend/docker-compose.multi.yml`

Update the three image references (one per environment):

```yaml
# Before (appears 3 times)
image: ghcr.io/graphfolio/graphfolio-backend:${PROD_IMAGE_TAG:-main}
image: ghcr.io/graphfolio/graphfolio-backend:${DEV_IMAGE_TAG:-develop}
image: ghcr.io/graphfolio/graphfolio-backend:${STAGING_IMAGE_TAG:-develop}

# After
image: ghcr.io/YOUR_USERNAME/tinboker-backend:${PROD_IMAGE_TAG:-main}
image: ghcr.io/YOUR_USERNAME/tinboker-backend:${DEV_IMAGE_TAG:-develop}
image: ghcr.io/YOUR_USERNAME/tinboker-backend:${STAGING_IMAGE_TAG:-develop}
```

### 4.5 `frontend/.github/workflows/deploy.yml`

**Change 1** — add `working-directory` to npm steps:

```yaml
- name: Install dependencies
  working-directory: frontend       # ← ADD
  run: npm ci

- name: Build
  working-directory: frontend       # ← ADD
  run: npm run build
  env:
    VITE_GOOGLE_CLIENT_ID: ${{ env.VITE_GOOGLE_CLIENT_ID }}
```

**Change 2** — Cloudflare Pages project name and output directory:

```yaml
- name: Deploy to Cloudflare Pages
  uses: cloudflare/pages-action@v1
  with:
    apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
    projectName: tinboker-platform     # ← was: graphfolio-webui
    directory: frontend/dist           # ← was: dist
    gitHubToken: ${{ secrets.GITHUB_TOKEN }}
    branch: ${{ steps.env.outputs.branch }}
```

### 4.6 Systemd service files (`backend/deploy/systemd/*.service`)

Update `WorkingDirectory` in all three files:

```ini
# Before
WorkingDirectory=/app

# After
WorkingDirectory=/app/backend
```

---

## Part 5 — Cloudflare Pages

### 5a. Rename the existing project (zero downtime, recommended)

1. Cloudflare → Workers & Pages → `graphfolio-webui`
2. Settings → General → Project name → rename to `tinboker-platform`
3. Your `pages.dev` preview subdomain changes to `tinboker-platform.pages.dev`
4. Update the CNAME root record in DNS (Part 1.3) to `tinboker-platform.pages.dev`
5. The custom domain `tinboker.com` stays connected automatically

### 5b. Connect repo to Cloudflare Pages

If creating fresh:
1. Workers & Pages → Create application → Pages → Connect to Git
2. Select `tinboker-platform` repo
3. Build settings:
   - **Framework preset:** Vite
   - **Build command:** `npm ci && npm run build`
   - **Build output directory:** `dist`
   - **Root directory:** `frontend`
4. Environment variables → add: `VITE_GOOGLE_CLIENT_ID` = (get from GCP Secret Manager `GOOGLE_CLIENT_ID`)

---

## Part 6 — VPS migration (re-point `/app` to new repo)

The VPS currently has `/app` = clone of `Graphfolio-Backend`. The deploy workflow SSHs
in and does `cd /app && git reset --hard`, so `/app` must become the `tinboker-platform`
monorepo root. Docker commands then run from `/app/backend/`.

```bash
ssh root@152.53.136.182

# 1. Save the GCP service account key (not in git)
cp /app/gcp-service-account.json ~/gcp-sa-backup.json

# 2. Containers keep running — they are not affected by source changes
#    Verify they are healthy before proceeding
docker ps
curl http://localhost:8000/health   # should return 200

# 3. Remove old /app, clone new monorepo
mv /app /app_old
git clone git@github.com:YOUR_USERNAME/tinboker-platform.git /app

# 4. Restore the service account key into the new backend directory
cp ~/gcp-sa-backup.json /app/backend/gcp-service-account.json

# 5. Verify docker-compose still runs (images are already pulled, no rebuild needed)
cd /app/backend
docker compose -f docker-compose.multi.yml ps

# 6. Confirm services still healthy
curl http://localhost:8000/health
curl http://localhost:8001/health
curl http://localhost:8002/health

# 7. Re-register systemd services (WorkingDirectory updated to /app/backend)
cd /app/backend
bash deploy/setup-systemd.sh

# 8. Clean up old repo
rm -rf /app_old
```

---

## Part 7 — Cold start (first time ever deploying on a fresh VPS)

If this is a brand new server with no running containers:

```bash
ssh root@152.53.136.182

# 1. Clone repo
git clone git@github.com:YOUR_USERNAME/tinboker-platform.git /app
cd /app/backend

# 2. Place GCP service account key
scp local-machine:/path/to/gcp-service-account.json /app/backend/gcp-service-account.json

# 3. Create shared Docker network
docker network create app_default

# 4. Log in to GHCR
echo "YOUR_GHCR_TOKEN" | docker login ghcr.io -u YOUR_USERNAME --password-stdin

# 5. Pull all images
docker compose -f docker-compose.multi.yml pull

# 6. Start everything
docker compose -f docker-compose.multi.yml up -d

# 7. Wait and verify
sleep 30
curl http://localhost:8000/health
curl http://localhost:8001/health
curl http://localhost:8002/health

# 8. Register systemd services
bash deploy/setup-systemd.sh
```

---

## Part 8 — Database

### SQLite (default for dev/staging)

Auto-created at startup. No manual steps required. The app calls `init_db()` via the
FastAPI lifespan event in `src/main.py`. Tables are created with `CREATE TABLE IF NOT
EXISTS`, so re-running is safe.

Default path: `/app/backend/data/graphfolio.db` (inside the container).

> **Important:** `docker-compose.multi.yml` does not mount a volume for SQLite. Data is
> lost on container rebuild. For persistence, add a volume mount:
> ```yaml
> volumes:
>   - ./data:/app/data
> ```

### PostgreSQL — `podcast_db` (recommendations, read-only from backend)

The backend reads recommendation data from an external PostgreSQL instance managed by
a separate Docker Compose stack (`docker-db`). The backend connects using:

```
Host:     docker-db_postgres-1   (Docker internal DNS)
Port:     5432
DB:       podcast_db
User:     podcast_user
Password: stored in GCP Secret Manager as POSTGRES_PASSWORD
```

This database is managed by the podcast pipeline, not by this repo. The backend is
read-only. No migrations to run here.

### Firestore — `graphfolio-db`

Main application data (episodes, podcast metadata, user data). Managed by GCP — no
setup needed. The backend accesses it via the service account JSON key.

Database ID: `graphfolio-db` (set as `FIRESTORE_DATABASE_ID` env var in `docker-compose.multi.yml`).

---

## Part 9 — Environment variables reference

Variables set in `docker-compose.multi.yml` are passed directly to containers. Secrets
not listed here are loaded from GCP Secret Manager at runtime by `src/config_loader.py`.

| Variable | Value | Notes |
|---|---|---|
| `ENVIRONMENT` | `production` / `development` / `staging` | Controls DB enforcement, logging |
| `USE_POSTGRES` | `true` | Forces PostgreSQL; production auto-enables this |
| `REDIS_URL` | `redis://redis:6379/0` | Docker internal network |
| `GCP_PROJECT_ID` | `gen-lang-client-0901363254` | Enables Secret Manager |
| `GOOGLE_APPLICATION_CREDENTIALS` | `/app/gcp-service-account.json` | Mounted at runtime |
| `POSTGRES_HOST` | `docker-db_postgres-1` | External Docker network |
| `POSTGRES_DB` | `podcast_db` | Recommendation data |
| `POSTGRES_USER` | `podcast_user` | |
| `POSTGRES_PASSWORD` | loaded from GSM | |
| `FIRESTORE_DATABASE_ID` | `graphfolio-db` | Named Firestore instance |
| `CORS_ORIGINS` | `["https://tinboker.com",...]` | Set per environment in compose file |

For **local development** (not Docker), copy `backend/.env.example` to `backend/.env`
and fill in values. The app loads `.env` before falling back to Secret Manager.

---

## Part 10 — Verification checklist

Work through this after completing all steps above:

- [ ] Push to `main` → GitHub Actions "Build & Deploy" passes
- [ ] Docker image appears at `ghcr.io/YOUR_USERNAME/tinboker-backend:main`
- [ ] VPS deploy SSH step shows `cd /app/backend` in Actions log
- [ ] `curl https://api.tinboker.com/health` → `{"status":"healthy"}`
- [ ] `curl https://dev-api.tinboker.com/health` → 200
- [ ] `curl https://staging-api.tinboker.com/health` → 200
- [ ] Push to `main` → frontend deploys to Cloudflare Pages project `tinboker-platform`
- [ ] `https://tinboker.com` loads the frontend
- [ ] Google Login works (OAuth redirect URI registered for `tinboker.com`)
- [ ] Scheduled health-check workflow passes at next run
- [ ] Old repos (`Graphfolio-WebUI`, `Graphfolio-Backend`) archived on GitHub

---

## Useful commands

```bash
# SSH into VPS
ssh root@152.53.136.182

# View all running containers
docker ps

# Tail logs for a service
docker logs -f graphfolio-backend-prod
docker logs -f graphfolio-backend-dev
docker logs -f graphfolio-backend-staging

# Restart a single service (no downtime for others)
cd /app/backend
docker compose -f docker-compose.multi.yml restart backend-prod

# Manual redeploy production without CI
cd /app/backend
git pull origin main
PROD_IMAGE_TAG=main docker compose -f docker-compose.multi.yml pull backend-prod
PROD_IMAGE_TAG=main docker compose -f docker-compose.multi.yml up -d --no-deps backend-prod

# Force-clear Redis cache
docker exec graphfolio-redis redis-cli FLUSHALL

# Caddy logs
journalctl -u caddy -f

# Caddy reload after Caddyfile change
systemctl reload caddy
```

---

## Port reference

| Container | VPS Port | Public URL |
|---|---|---|
| backend-prod | 8000 | api.tinboker.com |
| backend-dev | 8001 | dev-api.tinboker.com |
| backend-staging | 8002 | staging-api.tinboker.com |
| Redis | 6379 (localhost only) | — |
| Netdata | 19999 (localhost only) | api.tinboker.com/netdata/ |
