#!/bin/bash
# Setup script for Graphfolio systemd services
# Run this on the VPS to enable auto-start on boot

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SYSTEMD_DIR="/etc/systemd/system"

echo "Installing Graphfolio systemd services..."

# Copy service files
cp "$SCRIPT_DIR/systemd/graphfolio-prod.service" "$SYSTEMD_DIR/"
cp "$SCRIPT_DIR/systemd/graphfolio-staging.service" "$SYSTEMD_DIR/"
cp "$SCRIPT_DIR/systemd/graphfolio-dev.service" "$SYSTEMD_DIR/"

# Reload systemd daemon
systemctl daemon-reload

# Enable services
echo "Enabling services..."
systemctl enable graphfolio-prod.service
systemctl enable graphfolio-staging.service
systemctl enable graphfolio-dev.service

# Start services if not already running
echo "Starting services..."
systemctl start graphfolio-prod.service || true
systemctl start graphfolio-staging.service || true
systemctl start graphfolio-dev.service || true

echo ""
echo "=== Service Status ==="
systemctl status graphfolio-prod.service --no-pager || true
echo ""
systemctl status graphfolio-staging.service --no-pager || true
echo ""
systemctl status graphfolio-dev.service --no-pager || true

echo ""
echo "Done! Services will now start automatically on boot."
echo ""
echo "Useful commands:"
echo "  systemctl status graphfolio-prod"
echo "  systemctl restart graphfolio-prod"
echo "  systemctl stop graphfolio-prod"
echo "  journalctl -u graphfolio-prod -f"
