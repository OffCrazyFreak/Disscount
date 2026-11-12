-- A barcode padded with leading zeros is the same product as the bare code (#713), so stored codes take the one
-- spelling the backend now writes, CanonicalBarcode.of, ported from cijene-api's normalize_barcode. In-store
-- (GS1 restricted circulation) codes keep their zeros, as they name a different product in every chain.
-- Read-only counts on 2026-11-12 found no row to change and none that would collide on dev or production, so this
-- guards rows written between then and the release. A collision fails the migration instead of merging rows.

CREATE FUNCTION pg_temp.canonical_barcode(code text) RETURNS text
    LANGUAGE sql IMMUTABLE AS $$
SELECT CASE
           WHEN code !~ '^[0-9]{8,}$' OR ltrim(code, '0') = '' THEN code
           WHEN length(ltrim(code, '0')) <= 8
               AND left(lpad(ltrim(code, '0'), 8, '0'), 1) IN ('0', '2') THEN code
           WHEN length(ltrim(code, '0')) BETWEEN 9 AND 13
               AND (left(lpad(ltrim(code, '0'), 13, '0'), 2) IN ('02', '04')
                   OR left(lpad(ltrim(code, '0'), 13, '0'), 1) = '2') THEN code
           WHEN length(ltrim(code, '0')) = 14
               AND (substr(code, 2, 2) IN ('02', '04') OR substr(code, 2, 1) = '2') THEN code
           ELSE ltrim(code, '0')
       END
$$;

UPDATE app.product_image_set SET ean = pg_temp.canonical_barcode(ean)
WHERE ean <> pg_temp.canonical_barcode(ean);

UPDATE app.product_image SET ean = pg_temp.canonical_barcode(ean)
WHERE ean <> pg_temp.canonical_barcode(ean);

UPDATE app.watchlist_item SET product_api_id = pg_temp.canonical_barcode(product_api_id)
WHERE product_api_id <> pg_temp.canonical_barcode(product_api_id);

UPDATE app.shopping_list_item SET ean = pg_temp.canonical_barcode(ean)
WHERE ean <> pg_temp.canonical_barcode(ean);

DROP FUNCTION pg_temp.canonical_barcode(text);
