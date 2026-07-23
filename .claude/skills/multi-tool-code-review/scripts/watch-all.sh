#!/usr/bin/env bash
# ~15-min heartbeat watcher. Exits 0 when all three external reviewers have
# written their "run FINISHED" marker, or exits 3 every 15 min so a human (or
# the loop) catches stalls. Uses FINISHED markers only, so a crashed runner
# never false-completes.
set -u
cd "$(git rev-parse --show-toplevel)" || exit 1
ROOT="reviews/_review-run"
HEARTBEAT=$(($(date +%s) + 15 * 60))

finished() { grep -c "run FINISHED" "$1" 2>/dev/null || echo 0; }

while :; do
  cr=$(finished "$ROOT/cr/_STATUS.txt")
  cur=$(finished "$ROOT/cursor/_STATUS.txt")
  cx=$(finished "$ROOT/codex/_STATUS.txt")
  if [ "$cr" -ge 1 ] && [ "$cur" -ge 1 ] && [ "$cx" -ge 1 ]; then
    echo "ALL EXTERNAL REVIEWERS DONE $(date)"
    exit 0
  fi
  if [ "$(date +%s)" -ge "$HEARTBEAT" ]; then
    echo "HEARTBEAT $(date) | finished: cr=$cr cursor=$cur codex=$cx"
    exit 3
  fi
  sleep 60
done
