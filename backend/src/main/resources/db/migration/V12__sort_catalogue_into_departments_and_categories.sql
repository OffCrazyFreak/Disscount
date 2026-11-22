-- Filled at each catalogue import from catalog/taxonomy.yaml; null where no chain and no rule places the product.
ALTER TABLE app.product_image_set ADD COLUMN department character varying(32);
ALTER TABLE app.product_image_set ADD COLUMN category character varying(40);

-- People keeping the EAN on a shopping list or watchlist, refreshed at each import, so category pages lead with them.
ALTER TABLE app.product_image_set ADD COLUMN list_uses integer DEFAULT 0 NOT NULL;

CREATE INDEX idx_product_image_set_category ON app.product_image_set (category, last_seen_on);
