#!/usr/bin/env bash
# Checks status codes and head tags of a running build the way a crawler sees them.
# Usage: scripts/seo-check.sh http://localhost:3311
set -uo pipefail

BASE="${1:?Usage: scripts/seo-check.sh <base-url>}"
BASE="${BASE%/}"

# Next streams metadata into the body for browsers and keeps it in <head> only for known bots.
BOT_AGENT="Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"

# A well-formed GTIN-13 with a valid check digit that no chain sold on 2026-11-23.
UNKNOWN_EAN="3850000000002"

failures=0
body_file="$(mktemp)"
trap 'rm -f "$body_file"' EXIT

pass() { printf 'ok    %s\n' "$1"; }
fail() { printf 'FAIL  %s\n' "$1"; failures=$((failures + 1)); }

# Fetches a path into $body_file and prints the status code.
fetch() {
  curl -s -o "$body_file" -w '%{http_code}' -A "$BOT_AGENT" --max-time 60 "$BASE$1"
}

# Everything before </head>; read into a variable so grep -q never cuts a pipe short under pipefail.
head_section() {
  awk '{ end = index($0, "</head>"); if (end) { print substr($0, 1, end + 6); exit } print }' "$body_file"
}

count_in_head() {
  local head
  head="$(head_section)"
  grep -o "$1" <<< "$head" | wc -l | tr -d ' '
}

head_has() {
  local head
  head="$(head_section)"
  grep -q "$1" <<< "$head"
}

expect_status() {
  local path="$1" expected="$2" status
  status="$(fetch "$path")"

  if [[ "$status" == "$expected" ]]; then
    pass "$path answers $status"
  else
    fail "$path answers $status, expected $expected"
  fi
}

# An indexable page: 200, a <title>, one canonical, no noindex.
expect_indexable() {
  local path="$1" before=$failures
  expect_status "$path" 200

  [[ "$(count_in_head '<title>')" == 1 ]] || fail "$path has no single <title> in <head>"
  [[ "$(count_in_head 'rel="canonical"')" == 1 ]] || fail "$path has no single canonical"
  [[ "$(count_in_head 'name="robots"')" -le 1 ]] || fail "$path has more than one robots tag"
  head_has 'name="robots" content="noindex' && fail "$path says noindex"

  if [[ $failures == "$before" ]]; then pass "$path head tags"; fi
}

# A page that must stay out of the index: the status given, one noindex, and for a 404 no canonical.
expect_unindexed() {
  local path="$1" expected="$2" before=$failures
  expect_status "$path" "$expected"

  [[ "$(count_in_head 'name="robots"')" == 1 ]] || fail "$path has $(count_in_head 'name="robots"') robots tags, expected 1"
  head_has 'name="robots" content="noindex' || fail "$path does not say noindex"

  if [[ "$expected" == 404 ]]; then
    [[ "$(count_in_head 'rel="canonical"')" == 0 ]] || fail "$path 404 carries a canonical"
  fi

  if [[ $failures == "$before" ]]; then pass "$path head tags"; fi
}

first_loc() {
  grep -o '<loc>[^<]*</loc>' "$body_file" | sed 's#</\?loc>##g' | head -n "${1:-1}"
}

path_of() {
  printf '%s' "${1#"$BASE"}" | sed -E 's#^https?://[^/]+##'
}

echo "== robots and sitemaps"
expect_status /robots.txt 200
grep -q "^Sitemap: .*/sitemap-index.xml" "$body_file" || fail "robots.txt names no sitemap index"

expect_status /sitemap-index.xml 200
mapfile -t sitemaps < <(first_loc 1000)
[[ ${#sitemaps[@]} -gt 0 ]] || fail "sitemap-index.xml lists no sitemaps"

product_sitemap=""
category_sitemap=""
for sitemap in "${sitemaps[@]}"; do
  expect_status "$(path_of "$sitemap")" 200
  [[ "$sitemap" == */products/sitemap/* && -z "$product_sitemap" ]] && product_sitemap="$sitemap"
  [[ "$sitemap" == */categories/sitemap.xml ]] && category_sitemap="$sitemap"
done

echo "== products"
fetch "$(path_of "$product_sitemap")" > /dev/null
product_path="$(path_of "$(first_loc)")"
if [[ -n "$product_path" ]]; then expect_indexable "$product_path"; else fail "no product URL in $product_sitemap"; fi
expect_unindexed "/products/$UNKNOWN_EAN" 404
expect_status /products/not-an-ean 404

echo "== unknown pages"
expect_unindexed /this-page-does-not-exist 404
expect_unindexed /updates/this-update-does-not-exist 404

echo "== category hubs"
fetch "$(path_of "$category_sitemap")" > /dev/null
mapfile -t hub_urls < <(first_loc 100)
hub_path=""
for url in "${hub_urls[@]}"; do
  [[ "$url" == */categories/* ]] && { hub_path="$(path_of "$url")"; break; }
done
if [[ -n "$hub_path" ]]; then expect_indexable "$hub_path"; else fail "no hub in the category sitemap"; fi
expect_status "$hub_path?page=99999" 404

fetch /categories > /dev/null
hidden_hub=""
for slug in $(grep -o 'href="/categories/[a-z0-9-]*"' "$body_file" | sed -E 's#.*/categories/([^"]*)"#\1#' | sort -u); do
  printf '%s\n' "${hub_urls[@]}" | grep -q "/categories/$slug\$" || { hidden_hub="/categories/$slug"; break; }
done
if [[ -n "$hidden_hub" ]]; then expect_unindexed "$hidden_hub" 200; else fail "found no hub outside the sitemap"; fi

echo "== chains"
expect_indexable /chains/konzum
expect_unindexed /chains/this-chain-does-not-exist 404

echo
if [[ $failures -gt 0 ]]; then
  echo "$failures check(s) failed"
  exit 1
fi

echo "all checks passed"
