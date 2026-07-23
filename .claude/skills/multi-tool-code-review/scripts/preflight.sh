#!/usr/bin/env bash
# Preflight probe: what review engines exist here, and what branches can be
# reviewed. Read-only. Run this before asking the user the setup question so
# the work is divided across the engines that are actually installed.
set -u
cd "$(git rev-parse --show-toplevel)" || exit 1
export PATH="$HOME/.cursor/bin:$HOME/.local/bin:$PATH"

probe() {
  local name="$1" bin="$2" ver="$3"
  if command -v "$bin" >/dev/null 2>&1; then
    printf '  %-12s installed  (%s)\n' "$name" "$($ver 2>/dev/null | head -n1)"
  else
    printf '  %-12s MISSING    (skip this reviewer, spread its folders to the rest)\n' "$name"
  fi
}

echo "=== Review engines ==="
probe "CodeRabbit" coderabbit "coderabbit --version"
probe "Cursor" cursor-agent "cursor-agent --version"
probe "Codex" codex "codex --version"
probe "gh (issues/PR)" gh "gh --version"
echo
echo "Note: usage/quota is NOT checkable from the CLI (CodeRabbit's per-hour"
echo "limit, Cursor's free quota, Codex metering). Ask the user if unsure."
echo
echo "=== Current branch ==="
git rev-parse --abbrev-ref HEAD
echo
echo "=== Local branches ==="
git branch --format='  %(refname:short)'
echo
echo "=== Remote branches ==="
git branch -r --format='  %(refname:short)' | grep -v 'HEAD' || echo "  (none)"
echo
echo "=== Open pull requests (each reviewable as head vs base) ==="
if command -v gh >/dev/null 2>&1; then
  gh pr list --state open --json number,title,headRefName,baseRefName \
    --template '{{range .}}  #{{.number}} {{.headRefName}} -> {{.baseRefName}}  {{.title}}{{"\n"}}{{end}}' 2>/dev/null |
    grep . || echo "  (none)"
else
  echo "  (gh not installed)"
fi
echo
echo "A review target is EITHER a branch pair OR an open PR (its head vs base)."
echo "Offer these as concrete options; do not ask the user to type a target."
echo "Sanity-check ordering with: git rev-list --left-right --count <base>...<target>"
