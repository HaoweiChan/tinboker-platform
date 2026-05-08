#!/bin/bash
# Setup script for TinBoker systemd services
# Run this on the VPS to enable auto-start on boot

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SYSTEMD_DIR="/etc/systemd/system"

echo "Installing TinBoker systemd services..."

# Copy service files
cp "$SCRIPT_DIR/systemd/tinboker-prod.service" "$SYSTEMD_DIR/"
cp "$SCRIPT_DIR/systemd/tinboker-staging.service" "$SYSTEMD_DIR/"
cp "$SCRIPT_DIR/systemd/tinboker-dev.service" "$SYSTEMD_DIR/"

# Reload systemd daemon
systemctl daemon-reload

# Enable services
echo "Enabling services..."
systemctl enable tinboker-prod.service
systemctl enable tinboker-staging.service
systemctl enable tinboker-dev.service

# Start services if not already running
echo "Starting services..."
systemctl start tinboker-prod.service || true
systemctl start tinboker-staging.service || true
systemctl start tinboker-dev.service || true

echo ""
echo "=== Service Status ==="
systemctl status tinboker-prod.service --no-pager || true
echo ""
systemctl status tinboker-staging.service --no-pager || true
echo ""
systemctl status tinboker-dev.service --no-pager || true

echo ""
echo "Done! Services will now start automatically on boot."
echo ""
echo "Useful commands:"
echo "  systemctl status tinboker-prod"
echo "  systemctl restart tinboker-prod"
echo "  systemctl stop tinboker-prod"
echo "  journalctl -u tinboker-prod -f"
