#!/usr/bin/env bash
# Master Orchestrator - Manages all automation cron jobs
# Usage: ./scripts/orchestrate.sh {start|stop|status}

set -euo pipefail

PROJECT_DIR="${HOME}/alleato-project-manager"
LOG_DIR="${PROJECT_DIR}/logs"
MASTER_LOG="${LOG_DIR}/master.log"
CRON_TAG="# alleato-auto"

mkdir -p "$LOG_DIR"

log() {
  local msg="[$(date -Iseconds)] $1"
  echo "$msg"
  echo "$msg" >> "$MASTER_LOG"
}

# Define all cron jobs
declare -A CRON_JOBS
CRON_JOBS=(
  ["sync"]="*/15 * * * * ${PROJECT_DIR}/scripts/sync-cron.sh ${CRON_TAG}"
  ["test"]="0 * * * * ${PROJECT_DIR}/scripts/test-heal-cron.sh ${CRON_TAG}"
  ["error"]="*/30 * * * * ${PROJECT_DIR}/scripts/error-monitor.sh ${CRON_TAG}"
  ["backup"]="0 0 * * * ${PROJECT_DIR}/scripts/backup-cron.sh ${CRON_TAG}"
  ["lighthouse"]="30 * * * * ${PROJECT_DIR}/scripts/lighthouse-cron.sh ${CRON_TAG}"
)

start_all() {
  log "═══════════════════════════════════════════"
  log "STARTING ALL AUTOMATION"
  log "═══════════════════════════════════════════"

  # Make all scripts executable
  chmod +x "${PROJECT_DIR}/scripts/"*.sh 2>/dev/null || true

  # Create required directories
  mkdir -p "${PROJECT_DIR}/logs"
  mkdir -p "${PROJECT_DIR}/test-reports"
  mkdir -p "${PROJECT_DIR}/backups"
  mkdir -p "${PROJECT_DIR}/docs"

  # Remove existing alleato cron jobs, then add new ones
  local existing_cron
  existing_cron=$(crontab -l 2>/dev/null || true)
  local clean_cron
  clean_cron=$(echo "$existing_cron" | grep -v "$CRON_TAG" || true)

  # Build new crontab
  local new_cron="$clean_cron"

  for job_name in "${!CRON_JOBS[@]}"; do
    local entry="${CRON_JOBS[$job_name]}"
    new_cron="${new_cron}
${entry}"
    log "  Installed: ${job_name} → $(echo "$entry" | sed "s/ ${CRON_TAG}//")"
  done

  # Install crontab
  echo "$new_cron" | crontab -

  log ""
  log "All cron jobs installed:"
  log "  Sync:         Every 15 minutes"
  log "  Tests:        Every hour (:00)"
  log "  Error Monitor: Every 30 minutes"
  log "  Backup:       Daily at midnight"
  log "  Lighthouse:   Every hour (:30)"
  log ""
  log "═══════════════════════════════════════════"
  log "AUTOMATION STARTED"
  log "═══════════════════════════════════════════"
}

stop_all() {
  log "═══════════════════════════════════════════"
  log "STOPPING ALL AUTOMATION"
  log "═══════════════════════════════════════════"

  local existing_cron
  existing_cron=$(crontab -l 2>/dev/null || true)
  local clean_cron
  clean_cron=$(echo "$existing_cron" | grep -v "$CRON_TAG" || true)

  echo "$clean_cron" | crontab -

  log "All alleato cron jobs removed."
  log ""
  log "═══════════════════════════════════════════"
  log "AUTOMATION STOPPED"
  log "═══════════════════════════════════════════"
}

show_status() {
  echo "╔════════════════════════════════════════════════════════════════╗"
  echo "║  Alleato Project Manager - System Status                      ║"
  echo "╠════════════════════════════════════════════════════════════════╣"
  echo ""

  # Check cron jobs
  local cron_list
  cron_list=$(crontab -l 2>/dev/null || true)
  local alleato_crons
  alleato_crons=$(echo "$cron_list" | grep "$CRON_TAG" || true)

  if [ -z "$alleato_crons" ]; then
    echo "  Cron Jobs: NOT RUNNING"
    echo "    Run './scripts/orchestrate.sh start' to enable automation."
  else
    echo "  Cron Jobs: ACTIVE"
    echo "$alleato_crons" | while IFS= read -r line; do
      local schedule
      schedule=$(echo "$line" | awk '{print $1, $2, $3, $4, $5}')
      local script
      script=$(echo "$line" | awk '{print $6}' | xargs basename 2>/dev/null || echo "unknown")
      echo "    ${schedule}  →  ${script}"
    done
  fi

  echo ""

  # Check log files for last run times
  echo "  Last Run Times:"
  for log_name in sync testing error-monitor backup performance; do
    local log_file="${LOG_DIR}/${log_name}.log"
    if [ -f "$log_file" ]; then
      local last_line
      last_line=$(grep -E "(SUCCESS|FAILED|COMPLETE)" "$log_file" | tail -1 || true)
      if [ -n "$last_line" ]; then
        local timestamp
        timestamp=$(echo "$last_line" | grep -oP '\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}' || echo "unknown")
        local status
        if echo "$last_line" | grep -q "SUCCESS\|COMPLETE"; then
          status="OK"
        else
          status="FAILED"
        fi
        printf "    %-20s %-6s %s\n" "${log_name}:" "${status}" "${timestamp}"
      else
        printf "    %-20s %-6s\n" "${log_name}:" "NO DATA"
      fi
    else
      printf "    %-20s %-6s\n" "${log_name}:" "NO LOG"
    fi
  done

  echo ""

  # Check backup status
  if [ -d "${PROJECT_DIR}/backups" ]; then
    local latest_backup
    latest_backup=$(ls -1d "${PROJECT_DIR}/backups/"*/ 2>/dev/null | sort | tail -1 || true)
    if [ -n "$latest_backup" ]; then
      echo "  Latest Backup: $(basename "$latest_backup")"
    else
      echo "  Latest Backup: NONE"
    fi
  else
    echo "  Latest Backup: NO BACKUPS DIR"
  fi

  # Check test reports
  if [ -d "${PROJECT_DIR}/test-reports" ]; then
    local report_count
    report_count=$(ls -1 "${PROJECT_DIR}/test-reports/"*.json 2>/dev/null | wc -l || echo "0")
    echo "  Test Reports: ${report_count} files"
  fi

  echo ""
  echo "╚════════════════════════════════════════════════════════════════╝"
}

# ── Main ──────────────────────────────────────────────────────

case "${1:-}" in
  start)
    start_all
    ;;
  stop)
    stop_all
    ;;
  status)
    show_status
    ;;
  *)
    echo "Usage: $0 {start|stop|status}"
    echo ""
    echo "  start   Install all cron jobs and start automation"
    echo "  stop    Remove all cron jobs and stop automation"
    echo "  status  Show status of all automated systems"
    exit 1
    ;;
esac
