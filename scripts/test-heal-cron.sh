#!/usr/bin/env bash
# Automated Testing & Self-Healing - Cron Wrapper
# Cron entry: 0 * * * * /home/openclaw/alleato-project-manager/scripts/test-heal-cron.sh

set -euo pipefail

PROJECT_DIR="${HOME}/alleato-project-manager"
LOG_DIR="${PROJECT_DIR}/logs"
LOG_FILE="${LOG_DIR}/testing.log"
REPORT_DIR="${PROJECT_DIR}/test-reports"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
MAX_RETRIES=3

mkdir -p "$LOG_DIR" "$REPORT_DIR"

log() {
  echo "[$(date -Iseconds)] $1" | tee -a "$LOG_FILE"
}

log "═══════════════════════════════════════════"
log "TEST & HEAL CRON START"
log "═══════════════════════════════════════════"

cd "$PROJECT_DIR"

# Source environment
if [ -f "$PROJECT_DIR/.env" ]; then
  set -a
  source "$PROJECT_DIR/.env"
  set +a
fi

ATTEMPT=0
SUCCESS=false

while [ $ATTEMPT -lt $MAX_RETRIES ]; do
  ATTEMPT=$((ATTEMPT + 1))
  log "--- Attempt $ATTEMPT of $MAX_RETRIES ---"

  # Run the full test pipeline (test → analyze → heal → redeploy)
  if npm run test:pipeline >> "$LOG_FILE" 2>&1; then
    log "Test pipeline completed successfully"
  else
    log "Test pipeline exited with errors (this is expected if errors were found)"
  fi

  # Check the results
  HEAL_LOG="${REPORT_DIR}/heal-log.json"
  ERRORS_FILE="${REPORT_DIR}/latest-errors.json"

  if [ -f "$ERRORS_FILE" ]; then
    ERROR_COUNT=$(node -e "
      const r = JSON.parse(require('fs').readFileSync('${ERRORS_FILE}', 'utf8'));
      console.log(r.totalErrors || 0);
    " 2>/dev/null || echo "0")
  else
    ERROR_COUNT=0
  fi

  if [ "$ERROR_COUNT" -eq 0 ]; then
    log "All tests passed - no errors found"
    SUCCESS=true
    break
  fi

  log "Found $ERROR_COUNT errors"

  # Check if self-healing applied any fixes
  if [ -f "$HEAL_LOG" ]; then
    FIXES=$(node -e "
      const h = JSON.parse(require('fs').readFileSync('${HEAL_LOG}', 'utf8'));
      console.log(h.fixed || 0);
    " 2>/dev/null || echo "0")

    log "Self-healing applied $FIXES fixes"

    if [ "$FIXES" -eq 0 ]; then
      log "No auto-fixes available - stopping retry loop"
      break
    fi
  else
    log "No heal log found - stopping retry loop"
    break
  fi

  if [ $ATTEMPT -lt $MAX_RETRIES ]; then
    log "Retrying after self-healing fixes..."
  fi
done

# Save timestamped report
if [ -f "${REPORT_DIR}/latest-errors.json" ]; then
  cp "${REPORT_DIR}/latest-errors.json" "${REPORT_DIR}/errors-${TIMESTAMP}.json" 2>/dev/null || true
fi
if [ -f "${REPORT_DIR}/heal-log.json" ]; then
  cp "${REPORT_DIR}/heal-log.json" "${REPORT_DIR}/heal-log-${TIMESTAMP}.json" 2>/dev/null || true
fi

if [ "$SUCCESS" = true ]; then
  log "═══════════════════════════════════════════"
  log "TEST & HEAL CRON SUCCESS (attempt $ATTEMPT)"
  log "═══════════════════════════════════════════"
  exit 0
else
  log "═══════════════════════════════════════════"
  log "TEST & HEAL CRON COMPLETED WITH ISSUES"
  log "  Errors remaining: $ERROR_COUNT"
  log "  Attempts made: $ATTEMPT"
  log "═══════════════════════════════════════════"
  exit 1
fi
