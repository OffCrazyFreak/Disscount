#!/usr/bin/env bash
# Heartbeat watcher. Exits 0 when every external reviewer that ran has written
# its "run FINISHED" marker, or exits 3 on each heartbeat so a human (or the
# loop) catches stalls. The heartbeat is 15 minutes by default; set HEARTBEAT_MIN
# to change it. Uses FINISHED markers only, so a crashed runner never
# false-completes.
set -u
cd "$(git rev-parse --show-toplevel)" || exit 1
ROOT="reviews/_review-run"
HEARTBEAT_MIN="${HEARTBEAT_MIN:-15}"
HEARTBEAT=$(($(date +%s) + HEARTBEAT_MIN * 60))

# A reviewer that never ran (no status file) counts as done, so a missing engine
# does not block the exit; one that started must show its FINISHED marker.
done_or_absent() {
  local f="$1"
  [ -f "$f" ] || return 0
  grep -q "run FINISHED" "$f"
}

while :; do
  if done_or_absent "$ROOT/cr/_STATUS.txt" &&
    done_or_absent "$ROOT/cursor/_STATUS.txt" &&
    done_or_absent "$ROOT/codex/_STATUS.txt"; then
    echo "ALL PRESENT REVIEWERS DONE $(date)"
    exit 0
  fi
  if [ "$(date +%s)" -ge "$HEARTBEAT" ]; then
    echo "HEARTBEAT $(date)"
    exit 3
  fi
  sleep 60
done
