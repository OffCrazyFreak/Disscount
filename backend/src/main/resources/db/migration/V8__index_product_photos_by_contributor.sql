-- Every user upload counts the uploader's photos against the limits from #709: in total, since the start of the
-- UTC day, and per product. Only uploaded photos have a contributor, so the imported Open Food Facts rows stay out.
CREATE INDEX idx_product_image_contributor_created
    ON app.product_image (contributor_id, created_at)
    WHERE contributor_id IS NOT NULL;
