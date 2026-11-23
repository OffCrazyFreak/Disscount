-- Filled at each catalogue import from catalog/taxonomy.yaml; null where no chain and no rule places the product.
ALTER TABLE app.product_image_set ADD COLUMN department character varying(32);
ALTER TABLE app.product_image_set ADD COLUMN category character varying(40);
-- The rule file's hash at classification, so an edited file replaces the stored place instead of only filling gaps.
ALTER TABLE app.product_image_set ADD COLUMN taxonomy_version character varying(16);

-- People keeping the EAN on a shopping list or watchlist, refreshed at each import, so category pages lead with them.
ALTER TABLE app.product_image_set ADD COLUMN list_uses integer DEFAULT 0 NOT NULL;

-- Category pages read in exactly this order, so a page is an index range instead of a sort of the whole category.
CREATE INDEX idx_product_image_set_category_rank
    ON app.product_image_set (category, (chain_count + list_uses) DESC, store_listings DESC, ean);
