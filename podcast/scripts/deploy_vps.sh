#!/bin/bash
# Deploy podcast API to VPS
# Usage: ssh root@152.53.136.182 'bash -s' < scripts/deploy_vps.sh
# Or run directly on the VPS after cloning the repo.

set -e

REPO_DIR="/root/tinboker-agents"
PODCAST_DIR="$REPO_DIR/podcast"
SA_FILE="$PODCAST_DIR/gcp-service-account.json"

echo "=== Podcast API VPS Deployment ==="

# 1. Clone or pull the monorepo
if [ -d "$REPO_DIR/.git" ]; then
    echo "→ Pulling latest changes..."
    cd "$REPO_DIR" && git pull --ff-only
else
    echo "→ Cloning repository..."
    git clone https://github.com/HaoweiChan/tinboker-agents.git "$REPO_DIR"
fi

# 2. Set up Python venv
echo "→ Setting up Python virtual environment..."
cd "$PODCAST_DIR"
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
fi
source .venv/bin/activate

# 3. Install dependencies
echo "→ Installing dependencies..."
pip install --upgrade pip -q
pip install -r requirements.txt -q

# 4. Set up GCP credentials
if [ ! -f "$SA_FILE" ]; then
    if [ -f "/root/gcp-sa-backup.json" ]; then
        cp /root/gcp-sa-backup.json "$SA_FILE"
        chmod 600 "$SA_FILE"
        echo "→ Copied GCP service account from backup"
    else
        echo "ERROR: No GCP service account found!"
        echo "  Place it at $SA_FILE or /root/gcp-sa-backup.json"
        exit 1
    fi
fi

# 5. Install systemd service
echo "→ Installing systemd service..."
cat > /etc/systemd/system/podcast-api.service << 'EOF'
[Unit]
Description=Tinboker Podcast API (LangGraph Pipeline)
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
EOF

systemctl daemon-reload
systemctl enable podcast-api
systemctl restart podcast-api

echo "→ Waiting for service to start..."
sleep 3

# 6. Health check
if curl -sf http://localhost:8003/health > /dev/null 2>&1; then
    echo "✓ Podcast API is healthy on port 8003"
else
    echo "✗ Health check failed. Check: journalctl -u podcast-api -n 50"
    systemctl status podcast-api --no-pager
    exit 1
fi

echo ""
echo "=== Deployment complete ==="
echo "  Service: systemctl status podcast-api"
echo "  Logs:    journalctl -u podcast-api -f"
echo "  Health:  curl http://localhost:8003/health"
