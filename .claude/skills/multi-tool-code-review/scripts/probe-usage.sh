#!/usr/bin/env bash
# Live usage probe. Installed does not mean usable: an engine can be out of
# quota right now. This fires ONE trivial throwaway prompt at the cheap-to-probe
# engines (Cursor, Codex) and reports usable / OUT / unclear, so a dead engine
# is not offered or launched. CodeRabbit is NOT probed, because a probe would
# consume one of its 3 reviews per hour; ask the user about it instead.
set -u
cd "$(git rev-parse --show-toplevel)" || exit 1
export PATH="$HOME/.cursor/bin:$HOME/.local/bin:$PATH"
for d in "$HOME"/.local/share/nvm/*/bin; do [ -d "$d" ] && PATH="$d:$PATH"; done

# Distinctive CLI "you are out of usage" refusals, not generic rate-limit words.
LIMIT_RE='hit your usage limit|reached your usage limit|usage limit|ActionRequiredError|Get Cursor Pro|insufficient_quota|exceeded your current quota|quota exceeded|out of (usage|credits)'

verdict() {
  local out="$1"
  if printf '%s' "$out" | grep -qiE "$LIMIT_RE"; then
    echo "OUT of usage"
  elif printf '%s' "$out" | grep -qi 'PROBE_OK'; then
    echo "usable"
  else
    echo "unclear (ask the user)"
  fi
}

echo "=== Live usage probes (cheap engines only) ==="

if command -v cursor-agent >/dev/null 2>&1; then
  out=$(timeout 90 cursor-agent -p "Reply with exactly: PROBE_OK" --mode ask --force --output-format text 2>&1)
  printf '  %-10s %s\n' "Cursor" "$(verdict "$out")"
else
  printf '  %-10s %s\n' "Cursor" "not installed"
fi

if command -v codex >/dev/null 2>&1; then
  out=$(timeout 90 codex exec -s read-only "Reply with exactly: PROBE_OK" 2>&1)
  printf '  %-10s %s\n' "Codex" "$(verdict "$out")"
else
  printf '  %-10s %s\n' "Codex" "not installed"
fi

echo
echo "CodeRabbit is NOT probed (a probe burns 1 of its 3 reviews/hour). Ask the user."
echo "Claude subagents have no quota probe and are always available."