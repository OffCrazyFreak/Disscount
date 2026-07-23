#!/usr/bin/env bash
# Detached, resumable CodeRabbit runner. Consumes no Claude budget.
# Re-run any time: it skips folders that already have a .done sentinel.
# Success is detected by the completion marker only, never by grepping the
# review text (which echoes code that can contain "quota"/"429"/hashes).
set -u
cd "$(git rev-parse --show-toplevel)" || exit 1
export PATH="$HOME/.local/bin:$HOME/.cursor/bin:$PATH"

BASE="${REVIEW_BASE:-main}"
OUT="reviews/_review-run/cr"
STATUS="$OUT/_STATUS.txt"
mkdir -p "$OUT"

# High-value folders only. Edit per app / per review scope.
DIRS=(
  "frontend/src/app/(root)"
  "frontend/src/app/products"
  "frontend/src/app/(user)/shopping-lists"
  "frontend/src/app/(user)/watchlist"
  "frontend/src/app/(user)/digital-cards"
  "frontend/src/components/custom"
  "frontend/src/components/ui"
  "frontend/src/lib"
  "frontend/src/hooks"
  "backend/src/main/java"
)

echo "=== CR run started $(date) ===" >>"$STATUS"
for dir in "${DIRS[@]}"; do
  safe=$(echo "$dir" | tr '/() ' '____')
  out="$OUT/$safe.txt"
  done_marker="$OUT/$safe.done"
  if [ -f "$done_marker" ]; then
    echo "[$(date +%H:%M)] SKIP done: $dir" >>"$STATUS"
    continue
  fi
  waits=0
  while :; do
    echo "[$(date +%H:%M)] REVIEW dir=$dir" >>"$STATUS"
    coderabbit review --base "$BASE" --committed --dir "$dir" --config AGENTS.md >"$out" 2>&1
    if grep -q "Review complete" "$out"; then
      touch "$done_marker"
      echo "         OK" >>"$STATUS"
      break
    fi
    waits=$((waits + 1))
    if [ $waits -ge 6 ]; then
      echo "         GAVE UP after $waits waits; leaving no .done" >>"$STATUS"
      break
    fi
    echo "         no completion, sleeping 20m then retry ($waits/6)" >>"$STATUS"
    sleep 1200
  done
done
echo "=== CR run FINISHED $(date) ===" >>"$STATUS"
