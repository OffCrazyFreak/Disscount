-- Admin reads and contact inbox changes join the admin audit (#211), and rows older than 12 months are purged.
-- A contact message is no user, so target_user_id becomes optional and object_id names the message instead.

ALTER TABLE app.admin_audit ALTER COLUMN target_user_id DROP NOT NULL;
ALTER TABLE app.admin_audit ADD COLUMN object_id uuid;

ALTER TABLE app.admin_audit DROP CONSTRAINT ck_admin_audit_action;
ALTER TABLE app.admin_audit ADD CONSTRAINT ck_admin_audit_action CHECK (action IN (
    'DELETE_USER', 'PROMOTE_TO_ADMIN', 'DEMOTE_FROM_ADMIN',
    'READ_USER_LIST', 'READ_CONTACT_LIST', 'READ_CONTACT_LIST_WITH_DELETED', 'READ_CONTACT_MESSAGE',
    'MARK_CONTACT_MESSAGE_READ', 'MARK_CONTACT_MESSAGE_UNREAD', 'DELETE_CONTACT_MESSAGE', 'RESTORE_CONTACT_MESSAGE',
    'READ_AUDIT'
));

-- The read deduplication asks for one admin's latest row of one action, the purge for the oldest rows.
CREATE INDEX idx_admin_audit_actor_action_occurred ON app.admin_audit (actor_user_id, action, occurred_at);
CREATE INDEX idx_admin_audit_occurred ON app.admin_audit (occurred_at);

-- The backend login holds no DELETE on the audit, so this is its only way to remove rows, and only expired ones.
-- Owned by the migrator that runs Flyway; db/database-roles.sql grants EXECUTE to the backend login alone.
CREATE FUNCTION app.purge_admin_audit(OUT deleted integer)
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = app, pg_temp
AS $$
BEGIN
    DELETE FROM app.admin_audit
    WHERE occurred_at < (now() AT TIME ZONE 'UTC') - interval '12 months';

    GET DIAGNOSTICS deleted = ROW_COUNT;
END
$$;

REVOKE ALL ON FUNCTION app.purge_admin_audit() FROM PUBLIC;
