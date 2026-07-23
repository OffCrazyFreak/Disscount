#!/usr/bin/env bash
# Detached, resumable Cursor runner. Free tier, scarce quota; auto-resumes.
# --force bypasses the workspace-trust prompt in non-interactive mode.
set -u
cd "$(git rev-parse --show-toplevel)" || exit 1
export PATH="$HOME/.cursor/bin:$HOME/.local/bin:$PATH"

BASE="${REVIEW_BASE:-main}"
OUT="reviews/_review-run/cursor"
STATUS="$OUT/_STATUS.txt"
mkdir -p "$OUT"

# Fewer folders than CodeRabbit; Cursor's free quota is scarce.
DIRS=(
  "frontend/src/app/(root)"
  "frontend/src/app/products"
  "frontend/src/app/(user)/shopping-lists"
  "frontend/src/components/custom"
  "frontend/src/lib"
  "backend/src/main/java"
)

echo "=== Cursor run started $(date) ===" >>"$STATUS"
for dir in "${DIRS[@]}"; do
  safe=$(echo "$dir" | tr '/() ' '____')
  out="$OUT/$safe.txt"
  done_marker="$OUT/$safe.done"
  [ -f "$done_marker" ] && {
    echo "[$(date +%H:%M)] SKIP done: $dir" >>"$STATUS"
    continue
  }
  prompt="Review only the committed changes in $dir on this branch versus $BASE. For each real issue output one block: SEVERITY: <critical|major|minor|nitpick> | FILE: <path:line> | WHAT: <one line> | WHY: <one line> | FIX: <one line>. If nothing is wrong, output CLEAN. Be terse; do not restate unchanged code."
  waits=0
  while :; do
    echo "[$(date +%H:%M)] REVIEW dir=$dir" >>"$STATUS"
    cursor-agent -p "$prompt" --mode ask --force --output-format text >"$out" 2>&1
    if grep -qE '^SEVERITY:|CLEAN' "$out"; then
      touch "$done_marker"
      echo "         OK" >>"$STATUS"
      break
    fi
    waits=$((waits + 1))
    if [ $waits -ge 5 ]; then
      echo "         GAVE UP after $waits waits; no .done (likely quota)" >>"$STATUS"
      break
    fi
    echo "         no completion, sleeping 20m ($waits/5)" >>"$STATUS"
    sleep 1200
  done
done
echo "=== Cursor run FINISHED $(date) ===" >>"$STATUS"
