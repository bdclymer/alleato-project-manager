#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Alleato Project Manager - Test & Self-Heal Pipeline
# Run manually or via cron: 0 * * * * /path/to/run-pipeline.sh
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
REPORT_DIR="$PROJECT_DIR/test-reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$REPORT_DIR/cron-$TIMESTAMP.log"

# Ensure report dir exists
mkdir -p "$REPORT_DIR/screenshots"

# Load nvm/node if available (for cron environment)
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

# Also check common node locations
export PATH="$HOME/.local/bin:$HOME/.nvm/versions/node/$(ls $HOME/.nvm/versions/node/ 2>/dev/null | tail -1)/bin:/usr/local/bin:/usr/bin:$PATH"

# Load .env if exists
if [ -f "$PROJECT_DIR/.env" ]; then
  set -a
  source "$PROJECT_DIR/.env"
  set +a
fi

cd "$PROJECT_DIR"

echo "═══════════════════════════════════════════════════════════" | tee "$LOG_FILE"
echo "Pipeline run: $TIMESTAMP" | tee -a "$LOG_FILE"
echo "═══════════════════════════════════════════════════════════" | tee -a "$LOG_FILE"

# Run the Node.js pipeline
node tests/pipeline.mjs 2>&1 | tee -a "$LOG_FILE"

# Clean up old reports (keep last 48 hours = 48 runs)
find "$REPORT_DIR" -name "*.log" -mtime +2 -delete 2>/dev/null || true
find "$REPORT_DIR" -name "*.json" -mtime +2 ! -name "latest-*" -delete 2>/dev/null || true
find "$REPORT_DIR" -name "*.md" -mtime +2 ! -name "latest-*" -delete 2>/dev/null || true

echo "Pipeline complete. Log: $LOG_FILE" | tee -a "$LOG_FILE"
