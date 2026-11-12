-- Avatars leave the database for files on the public photo volume (#474); image keeps only a provider URL.
ALTER TABLE app.app_user ADD COLUMN avatar_key character varying(160);

-- The live avatar's file must never be queued for deletion while a profile still points at it.
CREATE UNIQUE INDEX uq_app_user_avatar_key ON app.app_user (avatar_key);

-- Written in the same transaction as the profile change it belongs to, and retried until the file is gone.
CREATE TABLE app.avatar_cleanup (
    id uuid NOT NULL,
    key_or_prefix character varying(512) NOT NULL,
    is_prefix boolean NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    CONSTRAINT avatar_cleanup_pkey PRIMARY KEY (id)
);

CREATE INDEX idx_avatar_cleanup_created ON app.avatar_cleanup (created_at);
