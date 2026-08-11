#!/usr/bin/env bash
#
# scripts/install_cron.sh — installs the news pipeline as a cron job.
#
# Installs the pipeline into the user's crontab for the CURRENT user.
# Default schedule: every Friday at 22:00 (end of the KHU school week).
# Override with the SCHEDULE env var or --schedule="30 9 * * 1".
#
# NOTE: cron email/`MAILTO` can be set here if you want failure notifications.
#
# Usage: scripts/install_cron.sh [--schedule="0 22 * * 5"]

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WRAPPER="$ROOT/scripts/cron_wrapper.sh"
LOG="$ROOT/_workspace/cron.log"

chmod +x "$ROOT/scripts/run_pipeline.ts" "$WRAPPER" 2>/dev/null || true

SCHEDULE=""
for a in "$@"; do
  case "$a" in
    --schedule=*) SCHEDULE="${a#--schedule=}" ;;
    *) echo "unknown arg: $a" >&2; exit 2 ;;
  esac
done
SCHEDULE="${SCHEDULE:-${SCHEDULE_VAR:-0 22 * * 5}}"   # default: Friday 22:00

LINE="$SCHEDULE  $WRAPPER >> $LOG 2>&1"
MARKER="RADIO NEWS PIPELINE"

# Append the job with a recognizable marker block so re-runs don't duplicate.
BLOCK="# === $MARKER ===
$LINE"

{ crontab -l 2>/dev/null || true; } > /tmp/cron.tmp.base
# Remove any previous pipeline block entries.
grep -v "# === $MARKER ===" /tmp/cron.tmp.base | grep -vF "$WRAPPER" > /tmp/cron.tmp.clean || true
{ cat /tmp/cron.tmp.clean; echo "$BLOCK"; } | crontab -

echo "Installed cron job:"
echo "  $LINE"
echo "Log: $LOG"
echo
crontab -l | grep -A1 "$MARKER" || true