CREATE TABLE "email_send" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"recipient_hash" text NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "email_send_recipient_sent_idx" ON "email_send" USING btree ("recipient_hash","sent_at");--> statement-breakpoint
CREATE INDEX "email_send_sent_idx" ON "email_send" USING btree ("sent_at");