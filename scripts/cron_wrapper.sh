#!/usr/bin/env bash
#
# scripts/cron_wrapper.sh — cron entrypoint for the news pipeline.
#
# cron runs with a minimal environment (no login shell, restricted PATH).
# This wrapper:
#   1. Sources the user's shell profile to restore PATH (node/npx/tsx/playwright)
#   2. cd's to the repo root
#   3. Runs the pipeline with strict error handling (set -e)
#   4. Logs stdout/stderr to a rotating log file for debugging
#
# Add to crontab (see scripts/install_cron.sh):
#   0 22 * * 5  /Users/user/Desktop/casts/scripts/cron_wrapper.sh >> /Users/user/Desktop/casts/_workspace/cron.log 2>&1

set -euo pipefail

# --- Restore a usable PATH for cron ---
# Prefer the login shell's environment; fall back to common paths.
if [ -f "$HOME/.zshrc" ]; then
  # shellcheck disable=SC1091
  source "$HOME/.zshrc" 2>/dev/null || true
fi
export PATH="/opt/homebrew/bin:/usr/local/bin:/opt/homebrew/opt/node/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "=============================================================="
echo "cron run started: $(date '+%Y-%m-%d %H:%M:%S %Z') (week: ${1:-auto})"
echo "node: $(command -v node) $(node --version 2>/dev/null || echo '?')"
echo "npx : $(command -v npx)"
echo "=============================================================="

# Pass through any args (e.g. --week=YYYY-MM-DD). Defaults to current week.
exec npx tsx scripts/run_pipeline.ts "$@"