#!/usr/bin/env bash
# Automated Database Backup - Cron Wrapper
# Cron entry: 0 0 * * * /home/openclaw/alleato-project-manager/scripts/backup-cron.sh

set -euo pipefail

PROJECT_DIR="${HOME}/alleato-project-manager"
LOG_DIR="${PROJECT_DIR}/logs"
LOG_FILE="${LOG_DIR}/backup.log"

mkdir -p "$LOG_DIR"

echo "[$(date -Iseconds)] === BACKUP CRON START ===" >> "$LOG_FILE"

cd "$PROJECT_DIR"

# Source environment
if [ -f "$PROJECT_DIR/.env" ]; then
  set -a
  source "$PROJECT_DIR/.env"
  set +a
fi

# Run backup
node scripts/backup-db.mjs >> "$LOG_FILE" 2>&1
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  echo "[$(date -Iseconds)] === BACKUP CRON SUCCESS ===" >> "$LOG_FILE"
else
  echo "[$(date -Iseconds)] === BACKUP CRON FAILED (exit $EXIT_CODE) ===" >> "$LOG_FILE"
fi

exit $EXIT_CODE
