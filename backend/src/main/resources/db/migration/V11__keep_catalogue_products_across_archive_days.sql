-- A daily archive holds only the chains that published that day, so a product stays listed until no import has priced it for 14 days.
ALTER TABLE app.product_image_set ADD COLUMN last_seen_on date;

-- Products priced in the last import count as seen on that day, so the sitemap keeps them after the deploy.
UPDATE app.product_image_set
SET last_seen_on = (SELECT finished_at::date FROM app.product_image_import_run WHERE kind = 'weekly-import')
WHERE store_listings > 0;

CREATE INDEX idx_product_image_set_last_seen ON app.product_image_set (last_seen_on);
