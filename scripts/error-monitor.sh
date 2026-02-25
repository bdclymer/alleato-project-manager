#!/usr/bin/env bash
# Error Monitoring & Auto-Fix - Cron Wrapper
# Cron entry: */30 * * * * /home/openclaw/alleato-project-manager/scripts/error-monitor.sh

set -euo pipefail

PROJECT_DIR="${HOME}/alleato-project-manager"
LOG_DIR="${PROJECT_DIR}/logs"
LOG_FILE="${LOG_DIR}/error-monitor.log"

mkdir -p "$LOG_DIR"

echo "[$(date -Iseconds)] === ERROR MONITOR CRON START ===" >> "$LOG_FILE"

cd "$PROJECT_DIR"

# Source environment
if [ -f "$PROJECT_DIR/.env" ]; then
  set -a
  source "$PROJECT_DIR/.env"
  set +a
fi

# Run error fixer
node pipeline/error-fixer.mjs >> "$LOG_FILE" 2>&1
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  echo "[$(date -Iseconds)] === ERROR MONITOR CRON SUCCESS ===" >> "$LOG_FILE"
else
  echo "[$(date -Iseconds)] === ERROR MONITOR CRON FAILED (exit $EXIT_CODE) ===" >> "$LOG_FILE"
fi

exit $EXIT_CODE
