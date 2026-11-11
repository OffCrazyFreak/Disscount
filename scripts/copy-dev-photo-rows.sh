#!/usr/bin/env bash
# Adds dev's rendered Open Food Facts photo rows to the local database, so local shows dev's
# product photos with R2_PUBLIC_URL=https://images-dev.disscount.me. Only adds: a row the local
# database already has, by id or by (ean, source, external_key), is left alone, and a product's
# main photo is filled in only where local has none. Rows a user uploaded, confirmed or deleted
# never leave dev. Needs `ssh disscount` and the local db from docker-compose.local-db.yml.
set -euo pipefail
cd "$(dirname "$0")/.."

# The tables moved into app in #429 R11; the path also finds them in public on a database from before.
local_psql() {
  docker compose -f docker-compose.local-db.yml exec -T -e PGOPTIONS='-c search_path=app,public' db sh -c 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" "$@"' psql "$@"
}

dev_psql() {
  ssh disscount 'docker exec -i -e PGOPTIONS="-c search_path=app,public" $(docker ps -qf name=disscount-development-.*-db-1) sh -c '\''psql -q -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" "$@"'\'' psql '"$*"
}

columns_sql="select string_agg(column_name, ',' order by column_name) from information_schema.columns where table_schema = current_schema() and table_name = 'product_image'"
local_columns=$(local_psql -Atc "$columns_sql")
dev_columns=$(dev_psql -At <<<"$columns_sql;")
if [[ ",$local_columns," != *",small_key,"* ]]; then
  echo "The local product_image table is missing or out of date. Start the backend once on current dev, then rerun." >&2
  exit 1
fi
# A branch can be ahead of or behind dev, so only columns both tables have are copied.
columns=$(comm -12 <(tr ',' '\n' <<<"$local_columns") <(tr ',' '\n' <<<"$dev_columns") | paste -sd,)

# Rows without the small list file are left out: the local re-render job would give them local files.
shown="source = 'OPEN_FOOD_FACTS' and status = 'VERIFIED' and full_key is not null and small_key is not null
  and contributor_id is null and confirmed_by_id is null and deleted_at is null and deleted_by_id is null"

{
  echo "begin;"
  echo "create temp table dev_rows (like product_image) on commit drop;"
  echo "create temp table dev_mains (ean varchar(14), main_image_id uuid) on commit drop;"
  echo "copy dev_rows ($columns) from stdin with (format csv);"
  dev_psql <<<"copy (select $columns from product_image where $shown) to stdout with (format csv);"
  echo '\.'
  echo "copy dev_mains from stdin with (format csv);"
  dev_psql <<<"copy (select ean, main_image_id from product_image_set where main_image_id in (select id from product_image where $shown)) to stdout with (format csv);"
  echo '\.'
  echo "with added as (insert into product_image ($columns) select $columns from dev_rows on conflict do nothing returning 1)
    select count(*) || ' photo rows added' from added;"
  # Search and list thumbnails read the product's main photo, so fill it where local has none.
  echo "with filled as (update product_image_set s set main_image_id = m.main_image_id from dev_mains m
      where s.ean = m.ean and s.main_image_id is null
        and exists (select 1 from product_image i where i.id = m.main_image_id and i.ean = s.ean)
      returning 1)
    select count(*) || ' main photos filled in' from filled;"
  echo "commit;"
} | local_psql -qAt
