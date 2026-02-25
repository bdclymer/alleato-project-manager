#!/usr/bin/env bash
# Auto-Sync from Job Planner - Cron Wrapper
# Cron entry: */15 * * * * /home/openclaw/alleato-project-manager/scripts/sync-cron.sh

set -euo pipefail

PROJECT_DIR="${HOME}/alleato-project-manager"
LOG_DIR="${PROJECT_DIR}/logs"
LOG_FILE="${LOG_DIR}/sync.log"

mkdir -p "$LOG_DIR"

echo "[$(date -Iseconds)] === SYNC CRON START ===" >> "$LOG_FILE"

cd "$PROJECT_DIR"

# Source environment
if [ -f "$PROJECT_DIR/.env" ]; then
  set -a
  source "$PROJECT_DIR/.env"
  set +a
fi

# Run sync
npm run sync >> "$LOG_FILE" 2>&1
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  echo "[$(date -Iseconds)] === SYNC CRON SUCCESS ===" >> "$LOG_FILE"
else
  echo "[$(date -Iseconds)] === SYNC CRON FAILED (exit $EXIT_CODE) ===" >> "$LOG_FILE"
fi

exit $EXIT_CODE
