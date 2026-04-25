# Production Container Reliability

Implementation report for ensuring Graphfolio backend containers are highly available and automatically recover from failures.

## Implementation Date

2026-02-02

## Problem Statement

On 2026-02-02, the production API (`api.tinboker.com`) was down because the `graphfolio-backend-prod` container was not running. Only staging and dev containers were active, causing:
- 502 errors from Cloudflare/Caddy
- Website falling back to mock data
- No automatic recovery mechanism

## Implemented Solutions

### 1. Systemd Services (Boot-time Auto-start)

Systemd service files ensure all containers start automatically when the VPS boots or restarts.

**Files Created:**
- `deploy/systemd/graphfolio-prod.service`
- `deploy/systemd/graphfolio-staging.service`
- `deploy/systemd/graphfolio-dev.service`
- `deploy/setup-systemd.sh`

**Installation:**
```bash
cd /app
./deploy/setup-systemd.sh
```

**Service Status:**
```bash
systemctl status graphfolio-prod
systemctl status graphfolio-staging
systemctl status graphfolio-dev
```

**Benefits:**
- Containers start automatically on VPS reboot
- Logs integrated with `journalctl`
- Standard Linux service management

### 2. GitHub Actions Health Check (Auto-recovery)

A scheduled GitHub Actions workflow checks API health every 10 minutes and restarts unhealthy containers.

**Workflow:** `.github/workflows/health-check.yml`

**Features:**
- Checks all three environments (prod, staging, dev)
- Restarts unhealthy containers via SSH
- Generates summary report
- Runs every 10 minutes

**Endpoints Monitored:**
- `https://api.tinboker.com/health`
- `https://staging-api.tinboker.com/health`
- `https://dev-api.tinboker.com/health`

### 3. UptimeRobot Monitoring (External Alerts)

External monitoring service provides alerts and uptime tracking.

**Configuration:**
- Monitor: HTTP check on `https://api.tinboker.com/health`
- Check interval: 5 minutes
- Alerts: Email notifications on downtime

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         VPS Boot                            │
│                            │                                │
│                            ▼                                │
│   ┌──────────────────────────────────────────────────────┐ │
│   │              Systemd Services                        │ │
│   │  graphfolio-prod.service                             │ │
│   │  graphfolio-staging.service                          │ │
│   │  graphfolio-dev.service                              │ │
│   └──────────────────────────────────────────────────────┘ │
│                            │                                │
│                            ▼                                │
│   ┌──────────────────────────────────────────────────────┐ │
│   │          Docker Containers Running                   │ │
│   │  • graphfolio-backend-prod (port 8000)               │ │
│   │  • graphfolio-backend-staging (port 8002)            │ │
│   │  • graphfolio-backend-dev (port 8001)                │ │
│   │  • graphfolio-redis                                  │ │
│   │  • graphfolio-netdata                                │ │
│   └──────────────────────────────────────────────────────┘ │
│                            ▲                                │
│                            │                                │
│   ┌────────────────────────┴───────────────────────────┐   │
│   │                                                     │   │
│   │  GitHub Actions         UptimeRobot                │   │
│   │  (every 10 mins)        (every 5 mins)             │   │
│   │  Auto-restart           Alerts                      │   │
│   │                                                     │   │
│   └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Recovery Scenarios

| Scenario | Recovery Method | Recovery Time |
|----------|-----------------|---------------|
| VPS reboot | Systemd auto-start | Immediate |
| Container crash | Docker restart policy | Seconds |
| Process hang | GitHub Actions | ≤ 10 minutes |
| Unknown failure | GitHub Actions | ≤ 10 minutes |

## Quick Recovery Commands

If manual intervention is needed:

```bash
# SSH to VPS
ssh root@152.53.136.182

# Check container status
docker ps -a | grep graphfolio

# Start production stack
cd /app
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Check logs
docker logs graphfolio-backend-prod --tail=50

# Verify health
curl http://localhost:8000/health
```

## Files Reference

| File | Purpose |
|------|---------|
| `deploy/systemd/graphfolio-prod.service` | Production systemd service |
| `deploy/systemd/graphfolio-staging.service` | Staging systemd service |
| `deploy/systemd/graphfolio-dev.service` | Development systemd service |
| `deploy/setup-systemd.sh` | Service installation script |
| `.github/workflows/health-check.yml` | Automated health check workflow |

## Related PRs

- PR #100: `hotfix/production-reliability` - Added systemd services and health check workflow
