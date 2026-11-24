-- One row per admin action that succeeded: who did it, to whom, what and when. Ids only, no email, name or free text.
-- Append only: the code inserts and never updates or deletes, and account erasure leaves these rows alone.

-- No foreign keys. An admin may delete an id that only the erasure ledger knows (a login that never got a profile),
-- and a key to app_user would block a later purge of erased profiles or cascade into the record of what an admin did.
CREATE TABLE public.admin_audit (
    id uuid NOT NULL,
    actor_user_id uuid NOT NULL,
    target_user_id uuid NOT NULL,
    action character varying(32) NOT NULL,
    occurred_at timestamp(6) without time zone NOT NULL,
    CONSTRAINT admin_audit_pkey PRIMARY KEY (id),
    CONSTRAINT ck_admin_audit_action CHECK (action IN ('DELETE_USER', 'PROMOTE_TO_ADMIN', 'DEMOTE_FROM_ADMIN'))
);
