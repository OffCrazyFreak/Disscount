-- A barcode padded with leading zeros is the same product as the bare code (#713), so stored codes take the one
-- spelling the backend now writes, CanonicalBarcode.of, ported from cijene-api's normalize_barcode. In-store
-- (GS1 restricted circulation) codes keep their zeros, as they name a different product in every chain.
-- Read-only counts on 2026-11-12 found no row to change and none that would collide on dev or production, so this
-- guards rows written between then and the release. A collision fails the migration instead of merging rows.

-- Step for step the same as CanonicalBarcode.of and isRestrictedCirculation, so a stored row matches a new lookup.
CREATE FUNCTION pg_temp.canonical_barcode(barcode text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
    code     text := btrim(barcode);
    stripped text;
    prefix   text;
BEGIN
    IF code !~ '^[0-9]{8,}$' THEN
        RETURN code;
    END IF;

    stripped := ltrim(code, '0');
    IF stripped = '' THEN
        RETURN code;
    END IF;

    IF length(stripped) <= 8 THEN
        IF left(lpad(stripped, 8, '0'), 1) IN ('0', '2') THEN
            RETURN code;
        END IF;
        RETURN stripped;
    END IF;

    -- A GTIN-14, or anything longer, is judged by the two digits behind its first one, as in the Java.
    IF length(stripped) <= 13 THEN
        prefix := left(lpad(stripped, 13, '0'), 2);
    ELSE
        prefix := substr(stripped, 2, 2);
    END IF;

    IF prefix IN ('02', '04') OR left(prefix, 1) = '2' THEN
        RETURN code;
    END IF;
    RETURN stripped;
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
