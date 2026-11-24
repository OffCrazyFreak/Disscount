-- The backend tables leave public for their own schema, so database roles can be granted per schema (#429 R11):
-- the backend's login gets app, the Next.js login gets auth and web, and neither can reach the other's tables.
-- SET SCHEMA keeps every row, index, constraint, foreign key and grant, so nothing is copied.
-- flyway_schema_history stays in public, where every Flyway job already looks for it.
-- From here on every migration names its schema (app.<table>), because Flyway runs them with search_path=public.

CREATE SCHEMA IF NOT EXISTS app;

ALTER TABLE public.admin_audit SET SCHEMA app;
ALTER TABLE public.app_user SET SCHEMA app;
ALTER TABLE public.contact_message SET SCHEMA app;
ALTER TABLE public.erasure_ledger SET SCHEMA app;
ALTER TABLE public.favorite_store SET SCHEMA app;
ALTER TABLE public.photo_cleanup SET SCHEMA app;
ALTER TABLE public.pinned_place SET SCHEMA app;
ALTER TABLE public.pinned_store SET SCHEMA app;
ALTER TABLE public.product_image SET SCHEMA app;
ALTER TABLE public.product_image_import_run SET SCHEMA app;
ALTER TABLE public.product_image_report SET SCHEMA app;
ALTER TABLE public.product_image_set SET SCHEMA app;
ALTER TABLE public.shopping_list SET SCHEMA app;
ALTER TABLE public.shopping_list_item SET SCHEMA app;
ALTER TABLE public.store_name_suggestion SET SCHEMA app;
ALTER TABLE public.store_name_usage SET SCHEMA app;
ALTER TABLE public.wallet_card SET SCHEMA app;
ALTER TABLE public.wallet_card_photo SET SCHEMA app;
ALTER TABLE public.watchlist_item SET SCHEMA app;
