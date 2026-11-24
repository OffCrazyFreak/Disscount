-- Sign-in and account events (#211), written by Next.js and purged by the Spring retention job.
CREATE TABLE "web"."security_event" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"occurred_at" timestamp DEFAULT (now() AT TIME ZONE 'UTC') NOT NULL,
	"event_type" varchar(48) NOT NULL,
	"outcome" varchar(16) NOT NULL,
	"user_id" uuid,
	"subject_hash" text,
	"ip_address" text,
	"user_agent" varchar(256),
	"country" varchar(2),
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "security_event_event_type_check" CHECK (event_type IN ('user_created', 'authn_login_success', 'authn_login_fail', 'authn_login_blocked_breached', 'authn_password_change', 'authn_password_reset', 'authn_password_set', 'authn_reauth_success', 'authn_reauth_fail', 'authn_identity_linked', 'authn_identity_unlinked', 'user_email_change_requested', 'user_email_changed', 'session_logout', 'session_revoked')),
	CONSTRAINT "security_event_outcome_check" CHECK (outcome IN ('success', 'failure', 'blocked')),
	CONSTRAINT "security_event_payload_size_check" CHECK (pg_column_size(payload) < 2048)
);
--> statement-breakpoint
CREATE INDEX "security_event_user_occurred_idx" ON "web"."security_event" USING btree ("user_id","occurred_at");--> statement-breakpoint
CREATE INDEX "security_event_occurred_idx" ON "web"."security_event" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "security_event_subject_occurred_idx" ON "web"."security_event" USING btree ("subject_hash","occurred_at") WHERE subject_hash IS NOT NULL;--> statement-breakpoint
-- The retention of the privacy policy (docs/AUTH.md, 8.6). The runtime logins hold no UPDATE or DELETE on the
-- table, so this is the only way rows change: addresses cleared at 29 days, failures gone at 30, the rest at 12 months.
-- Owned by the migrator that runs drizzle; db/database-roles.sql grants EXECUTE to the backend login alone.
CREATE FUNCTION "web"."purge_security_events"(OUT scrubbed integer, OUT deleted integer)
	LANGUAGE plpgsql
	SECURITY DEFINER
	SET search_path = web, pg_temp
AS $$
DECLARE
	utc_now timestamp := now() AT TIME ZONE 'UTC';
	failures_deleted integer;
BEGIN
	UPDATE web.security_event
	SET ip_address = NULL, user_agent = NULL
	WHERE occurred_at < utc_now - interval '29 days'
		AND (ip_address IS NOT NULL OR user_agent IS NOT NULL);
	GET DIAGNOSTICS scrubbed = ROW_COUNT;

	DELETE FROM web.security_event
	WHERE occurred_at < utc_now - interval '30 days'
		AND (outcome = 'failure' OR subject_hash IS NOT NULL);
	GET DIAGNOSTICS failures_deleted = ROW_COUNT;

	DELETE FROM web.security_event
	WHERE occurred_at < utc_now - interval '12 months';
	GET DIAGNOSTICS deleted = ROW_COUNT;

	deleted := deleted + failures_deleted;
END
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION "web"."purge_security_events"() FROM PUBLIC;
