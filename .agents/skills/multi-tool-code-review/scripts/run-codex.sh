#!/usr/bin/env bash
# Detached, resumable Codex runner (ChatGPT Plus). Read-only verifier on the
# high-risk folders. Feeds Codex a unified diff on stdin so it never edits.
set -u
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$(git rev-parse --show-toplevel)" || exit 1
# Codex ships next to node under nvm; adjust if installed elsewhere.
for d in "$HOME"/.local/share/nvm/*/bin; do [ -d "$d" ] && PATH="$d:$PATH"; done
export PATH="$HOME/.local/bin:$PATH"
source "$SCRIPT_DIR/_common.sh"

BASE="${REVIEW_BASE:-main}"
TARGET="${REVIEW_TARGET:-HEAD}"
EFFORT="${REVIEW_CODEX_EFFORT:-medium}"
MODEL="${REVIEW_CODEX_MODEL:-}"
OUT="reviews/_review-run/codex"
STATUS="$OUT/_STATUS.txt"
mkdir -p "$OUT"

# Codex is the verifier on the riskiest logic, not the broad sweep. Point it at
# fewer, higher-risk folders via REVIEW_DIRS; otherwise it auto-detects busiest.
mapfile -t DIRS < <(review_dirs "$BASE" "$TARGET")

echo "=== Codex run started $(date) ===" >>"$STATUS"
for dir in "${DIRS[@]}"; do
  safe=$(echo "$dir" | tr '/() ' '____')
  out="$OUT/$safe.txt"
  dfile="$OUT/$safe.diff"
  done_marker="$OUT/$safe.done"
  [ -f "$done_marker" ] && {
    echo "[$(date +%H:%M)] SKIP done: $dir" >>"$STATUS"
    continue
  }
  git diff "$BASE"..."$TARGET" -- "$dir" >"$dfile"
  [ -s "$dfile" ] || {
    touch "$done_marker"
    echo "[$(date +%H:%M)] EMPTY diff, skip: $dir" >>"$STATUS"
    continue
  }
  prompt="You are a strict code reviewer. Review this unified diff. For each real issue output one block: SEVERITY: <critical|major|minor|nitpick> | FILE: <path:line> | WHAT | WHY | FIX (each one line). If nothing is wrong, output CLEAN. Be terse."
  waits=0
  while :; do
    echo "[$(date +%H:%M)] REVIEW dir=$dir" >>"$STATUS"
    timeout 900 codex exec -s read-only ${MODEL:+-m "$MODEL"} -c model_reasoning_effort="$EFFORT" -o "$out" "$prompt" <"$dfile" >"$out.log" 2>&1
    if grep -qE '^SEVERITY:|CLEAN' "$out" 2>/dev/null; then
      touch "$done_marker"
      echo "         OK" >>"$STATUS"
      break
    fi
    if is_terminal_limit "$out" || is_terminal_limit "$out.log"; then
      echo "         OUT of usage (terminal limit); giving up now, no .done for remaining folders" >>"$STATUS"
      break 2
    fi
    waits=$((waits + 1))
    if [ $waits -ge 5 ]; then
      echo "         GAVE UP after $waits waits; no .done" >>"$STATUS"
      break
    fi
    echo "         no completion, sleeping 20m ($waits/5)" >>"$STATUS"
    sleep 1200
  done
done
echo "=== Codex run FINISHED $(date) ===" >>"$STATUS"
