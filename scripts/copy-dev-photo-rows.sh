#!/usr/bin/env bash
# Adds dev's rendered Open Food Facts photo rows to the local database, so local shows dev's
# product photos with R2_PUBLIC_URL=https://images-dev.disscount.me. Only adds rows: a row
# the local database already has, by id or by (ean, source, external_key), is left alone.
# Rows a user uploaded or confirmed never leave dev. Needs `ssh disscount` and the local db
# from docker-compose.local-db.yml.
set -euo pipefail
cd "$(dirname "$0")/.."

local_psql() {
  docker compose -f docker-compose.local-db.yml exec -T db sh -c 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" "$@"' psql "$@"
}

# Copy only the columns both schemas have, because a local branch can be ahead of or behind dev.
columns=$(local_psql -Atc "select string_agg(column_name, ',' order by ordinal_position) from information_schema.columns where table_schema = 'public' and table_name = 'product_image'")
if [[ ",$columns," != *",small_key,"* ]]; then
  echo "The local product_image table is missing or out of date. Start the backend once on current dev, then rerun." >&2
  exit 1
fi

dev_copy="copy (select $columns from product_image where source = 'OPEN_FOOD_FACTS' and status = 'VERIFIED' and full_key is not null and small_key is not null and contributor_id is null and confirmed_by_id is null) to stdout with (format csv)"

{
  echo "begin;"
  echo "create temp table dev_rows (like product_image) on commit drop;"
  echo "copy dev_rows ($columns) from stdin with (format csv);"
  ssh disscount 'docker exec -i $(docker ps -qf name=disscount-development-.*-db-1) sh -c '\''psql -q -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"'\''' <<<"$dev_copy;"
  echo '\.'
  echo "insert into product_image ($columns) select $columns from dev_rows on conflict do nothing;"
  echo "commit;"
} | local_psql -q

local_psql -Atc "select count(*) || ' Open Food Facts photo rows locally' from product_image where source = 'OPEN_FOOD_FACTS'"
