-- Own schemas, so each database login gets only its schemas (#429 R11). IF NOT EXISTS: the roles script may run first.
CREATE SCHEMA IF NOT EXISTS "auth";
--> statement-breakpoint
CREATE SCHEMA IF NOT EXISTS "web";
--> statement-breakpoint
ALTER TABLE "public"."account" SET SCHEMA "auth";
--> statement-breakpoint
ALTER TABLE "public"."jwks" SET SCHEMA "auth";
--> statement-breakpoint
ALTER TABLE "public"."rate_limit" SET SCHEMA "auth";
--> statement-breakpoint
ALTER TABLE "public"."session" SET SCHEMA "auth";
--> statement-breakpoint
ALTER TABLE "public"."user" SET SCHEMA "auth";
--> statement-breakpoint
ALTER TABLE "public"."verification" SET SCHEMA "auth";
--> statement-breakpoint
ALTER TABLE "public"."store_location" SET SCHEMA "web";
--> statement-breakpoint
ALTER TABLE "public"."store_location_sync" SET SCHEMA "web";
--> statement-breakpoint
ALTER TABLE "public"."store_hours" SET SCHEMA "web";
--> statement-breakpoint
ALTER TABLE "public"."store_hours_overlay" SET SCHEMA "web";
--> statement-breakpoint
ALTER TABLE "public"."store_hours_run" SET SCHEMA "web";
--> statement-breakpoint
ALTER TABLE "public"."email_send" SET SCHEMA "web";
