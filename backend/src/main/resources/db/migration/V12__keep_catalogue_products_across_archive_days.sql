-- A daily archive holds only the chains that published that day, so a product stays listed until none of the last 14 archives priced it.
ALTER TABLE app.product_image_set ADD COLUMN last_seen_on date;

-- Products priced in the last import count as seen that day; with no run recorded, today, so the sitemap never empties on deploy.
UPDATE app.product_image_set
SET last_seen_on = coalesce(
    (SELECT finished_at::date FROM app.product_image_import_run WHERE kind = 'weekly-import'),
    current_date)
WHERE store_listings > 0;

CREATE INDEX idx_product_image_set_last_seen ON app.product_image_set (last_seen_on);

-- Room on each page for the daily rewrite, so the new row version can stay on its page; it applies to pages written from now on.
ALTER TABLE app.product_image_set SET (fillfactor = 80);

-- The newest archive imported, so the hourly check imports each upstream date once; null for the photo seed.
ALTER TABLE app.product_image_import_run ADD COLUMN archive_date date;

-- The chains that priced each EAN in the window, so chain and store counts do not swing with who published today.
-- No index on last_seen_on: the daily expiry reads the whole table anyway, and leaving it out keeps the daily updates HOT.
CREATE TABLE app.product_chain_listing (
    ean character varying(14) NOT NULL,
    chain character varying(64) NOT NULL,
    store_listings integer NOT NULL,
    last_seen_on date NOT NULL,
    CONSTRAINT product_chain_listing_pkey PRIMARY KEY (ean, chain)
) WITH (fillfactor = 80);
