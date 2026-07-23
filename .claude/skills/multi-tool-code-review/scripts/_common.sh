#!/usr/bin/env bash
# Shared helpers for the review runners. Source this, do not execute it.
#
# review_dirs <base> [target] -> prints the folders to review, one per line,
# auto-detected from the diff so no repo-specific paths are baked in.
#
# Env overrides:
#   REVIEW_DIRS       explicit space/newline-separated folder list (skips detection)
#   REVIEW_DIR_DEPTH  path segments that define a "folder" (default 4)
#   REVIEW_MAX_DIRS   cap on how many folders to return, busiest first (default 12)

review_dirs() {
  local base="$1" target="${2:-HEAD}"
  local depth="${REVIEW_DIR_DEPTH:-4}" max="${REVIEW_MAX_DIRS:-12}"

  if [ -n "${REVIEW_DIRS:-}" ]; then
    printf '%s\n' $REVIEW_DIRS
    return 0
  fi

  git diff --name-only "$base"..."$target" |
    grep -vE '\.(md|mdx|ya?ml|lock|png|jpe?g|gif|svg|webp|ico|woff2?|ttf|eot|pdf)$' |
    grep -vE '(^|/)public/' |
    grep -vE '(^|/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock)$' |
    awk -v d="$depth" -F/ '{
      n = (NF - 1 < d ? NF - 1 : d)
      if (n < 1) next
      p = $1
      for (i = 2; i <= n; i++) p = p "/" $i
      print p
    }' |
    sort | uniq -c | sort -rn | awk -v m="$max" 'NR <= m {print $2}'
}
