-- A user watches a product once per watch type. The service looks for the live row before it inserts one,
-- but two requests at the same moment could both insert, so the database now refuses the second.

-- Older duplicates are soft deleted first, keeping the newest threshold (owner, 2026-11-10). Soft-deleted rows
-- stay out of the index, because a removed watch must not block watching the product again.
-- Timestamps are UTC without a zone, like Timestamps.nowUtc() writes them.
UPDATE public.watchlist_item AS item
SET deleted_at = now() AT TIME ZONE 'UTC'
FROM (
    SELECT id,
           row_number() OVER (
               PARTITION BY user_id, product_api_id, watch_type
               ORDER BY coalesce(updated_at, created_at) DESC, created_at DESC, id DESC
           ) AS newest_first
    FROM public.watchlist_item
    WHERE deleted_at IS NULL
) AS ranked
WHERE item.id = ranked.id
  AND ranked.newest_first > 1;

CREATE UNIQUE INDEX ux_watchlist_item_user_product_type
    ON public.watchlist_item (user_id, product_api_id, watch_type)
    WHERE deleted_at IS NULL;
