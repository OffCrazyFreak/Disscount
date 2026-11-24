-- Every enum column gets one CHECK named ck_<table>_<column> that lists the values the code has today.
-- Hibernate named them <table>_<column>_check and never refreshed them, and dev's product_image never got any,
-- so each old check is dropped if it exists and created again from the current enum.

ALTER TABLE public.app_user DROP CONSTRAINT IF EXISTS app_user_account_type_check;
ALTER TABLE public.app_user ADD CONSTRAINT ck_app_user_account_type
    CHECK (account_type IN ('ADMIN', 'CONSUMER', 'ENTERPRISE', 'PUBLIC_SECTOR'));

ALTER TABLE public.app_user DROP CONSTRAINT IF EXISTS app_user_acquisition_channel_check;
ALTER TABLE public.app_user ADD CONSTRAINT ck_app_user_acquisition_channel
    CHECK (acquisition_channel IN ('GOOGLE_SEARCH', 'INSTAGRAM', 'FACEBOOK', 'TIKTOK', 'YOUTUBE', 'FRIEND_OR_FAMILY',
                                   'ONLINE_AD', 'BLOG_OR_NEWS', 'APP_STORE', 'POSTER_OR_FLYER', 'EVENT', 'OTHER'));

ALTER TABLE public.product_image DROP CONSTRAINT IF EXISTS product_image_hidden_reason_check;
ALTER TABLE public.product_image ADD CONSTRAINT ck_product_image_hidden_reason
    CHECK (hidden_reason IN ('JOB_SKIPPED', 'ADMIN'));

ALTER TABLE public.product_image DROP CONSTRAINT IF EXISTS product_image_source_check;
ALTER TABLE public.product_image ADD CONSTRAINT ck_product_image_source
    CHECK (source IN ('OPEN_FOOD_FACTS', 'ADMIN', 'USER'));

ALTER TABLE public.product_image DROP CONSTRAINT IF EXISTS product_image_status_check;
ALTER TABLE public.product_image ADD CONSTRAINT ck_product_image_status
    CHECK (status IN ('CANDIDATE', 'PENDING', 'HIDDEN', 'VERIFIED'));

ALTER TABLE public.shopping_list DROP CONSTRAINT IF EXISTS shopping_list_link_access_check;
ALTER TABLE public.shopping_list ADD CONSTRAINT ck_shopping_list_link_access
    CHECK (link_access IN ('NONE', 'VIEW', 'SHOP', 'EDIT', 'OWNER'));

ALTER TABLE public.watchlist_item DROP CONSTRAINT IF EXISTS watchlist_item_watch_type_check;
ALTER TABLE public.watchlist_item ADD CONSTRAINT ck_watchlist_item_watch_type
    CHECK (watch_type IN ('PERCENTAGE', 'ABSOLUTE'));

-- Postgres never indexes the referencing column of a foreign key, so deleting a user or a list scanned these tables.
-- Foreign keys whose column already leads a unique constraint or index are left out.
CREATE INDEX idx_contact_message_user_id ON public.contact_message (user_id);
CREATE INDEX idx_shopping_list_owner_id ON public.shopping_list (owner_id);
CREATE INDEX idx_shopping_list_item_shopping_list_id ON public.shopping_list_item (shopping_list_id);
CREATE INDEX idx_shopping_list_item_updated_by_user_id ON public.shopping_list_item (updated_by_user_id);
CREATE INDEX idx_store_name_usage_suggestion_id ON public.store_name_usage (suggestion_id);
CREATE INDEX idx_watchlist_item_user_id ON public.watchlist_item (user_id);
