-- The three database logins and what each may touch (#429 R11, docs/INFRASTRUCTURE.md, Database roles).
--
--   migrator  owns the app, auth, web and drizzle schemas and every table in them; Flyway and drizzle run as it
--   backend   the Spring runtime: reads and writes app, reads the few better-auth columns it shows or cleans
--   web       the Next.js runtime: reads and writes auth and web, reads app.erasure_ledger's user ids
--
-- Run it as the database owner (POSTGRES_USER) with psql 15 or newer. It is idempotent: it creates what is missing,
-- hands every table to the migrator and replaces both runtime logins' grants with exactly the ones below, so a second
-- run changes nothing. Run it again after a migration that ran under another login, and after a restore.
--
--   read -rs MIGRATOR_PASSWORD; read -rs BACKEND_PASSWORD; read -rs WEB_PASSWORD
--   export MIGRATOR_PASSWORD BACKEND_PASSWORD WEB_PASSWORD
--   psql -d "$POSTGRES_DB" -f db/database-roles.sql
--
-- A password variable left unset or empty keeps that login's current password, so a re-run needs none of them.
-- psql variables migrator, backend and web (-v backend=...) override the login names below.

\set ON_ERROR_STOP on
\set QUIET on

\if :{?migrator}
\else
  \set migrator disscount_migrator
\endif

\if :{?backend}
\else
  \set backend disscount_backend
\endif

\if :{?web}
\else
  \set web disscount_web
\endif

\getenv migrator_password MIGRATOR_PASSWORD
\getenv backend_password BACKEND_PASSWORD
\getenv web_password WEB_PASSWORD

BEGIN;

-- Before the deploy that moves the tables, grants per schema would miss every table, and nothing would say so.
DO $$
BEGIN
    IF to_regclass('public.app_user') IS NOT NULL OR to_regclass('public."user"') IS NOT NULL THEN
        RAISE EXCEPTION 'the tables are still in public: deploy the release that moves them into app and auth first';
    END IF;
END
$$;


-- Logins. A new one has no password and so cannot sign in until it gets one.

SELECT format('CREATE ROLE %I LOGIN', name)
FROM unnest(array[:'migrator', :'backend', :'web']) AS name
WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = name)
\gexec

-- The runtime logins can never own, create or bypass anything. The migrator gets the same unless it is the owner.
SELECT format('ALTER ROLE %I NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS LOGIN', name)
FROM unnest(array[:'migrator', :'backend', :'web']) AS name
WHERE name <> current_user
\gexec

-- An error report quotes its statement, so it must never show one that holds a password.
\set VERBOSITY terse
\set SHOW_CONTEXT never

\if :{?migrator_password}
  SELECT format('ALTER ROLE %I PASSWORD %L', :'migrator', :'migrator_password') WHERE :'migrator_password' <> ''
  \gexec
\endif

\if :{?backend_password}
  SELECT format('ALTER ROLE %I PASSWORD %L', :'backend', :'backend_password') WHERE :'backend_password' <> ''
  \gexec
\endif

\if :{?web_password}
  SELECT format('ALTER ROLE %I PASSWORD %L', :'web', :'web_password') WHERE :'web_password' <> ''
  \gexec
\endif

\set VERBOSITY default
\set SHOW_CONTEXT errors

-- Older images name tables without a schema, so these paths keep a Rollback past R11 working (docs/INFRASTRUCTURE.md).
-- The migrator keeps the default path: Flyway finds its history table in the first schema of it.
ALTER ROLE :"backend" SET search_path = app, auth, public;
ALTER ROLE :"web" SET search_path = auth, web, app, public;


-- The database and its schemas.

SELECT format('GRANT CONNECT ON DATABASE %I TO %I, %I, %I', current_database(), :'migrator', :'backend', :'web')
\gexec

-- New schemas are made by the migrations, so the migrator may create them; public keeps Flyway's history table.
SELECT format('GRANT CREATE ON DATABASE %I TO %I', current_database(), :'migrator')
\gexec

GRANT USAGE, CREATE ON SCHEMA public TO :"migrator";

CREATE SCHEMA IF NOT EXISTS app AUTHORIZATION :"migrator";
CREATE SCHEMA IF NOT EXISTS auth AUTHORIZATION :"migrator";
CREATE SCHEMA IF NOT EXISTS web AUTHORIZATION :"migrator";
CREATE SCHEMA IF NOT EXISTS drizzle AUTHORIZATION :"migrator";

ALTER SCHEMA app OWNER TO :"migrator";
ALTER SCHEMA auth OWNER TO :"migrator";
ALTER SCHEMA web OWNER TO :"migrator";
ALTER SCHEMA drizzle OWNER TO :"migrator";

-- Tables made before the migrator existed, or by a migration run as another login, belong to it from now on,
-- because only a table's owner may alter it. A table's own sequences follow it.
SELECT format('ALTER %s %I.%I OWNER TO %I',
              CASE c.relkind WHEN 'S' THEN 'SEQUENCE' WHEN 'v' THEN 'VIEW' ELSE 'TABLE' END,
              n.nspname, c.relname, :'migrator')
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE (n.nspname IN ('app', 'auth', 'web', 'drizzle') OR (n.nspname = 'public' AND c.relname = 'flyway_schema_history'))
  AND c.relkind IN ('r', 'p', 'v', 'S')
  AND pg_get_userbyid(c.relowner) <> :'migrator'
  AND NOT EXISTS (SELECT FROM pg_depend d WHERE d.objid = c.oid AND d.deptype IN ('a', 'i'))
\gexec


-- Start both runtime logins from nothing, so a grant removed from this file is removed from the database too.

REVOKE ALL ON SCHEMA app, auth, web, drizzle, public FROM :"backend", :"web";
REVOKE ALL ON ALL TABLES IN SCHEMA app, auth, web, drizzle, public FROM :"backend", :"web";
REVOKE ALL ON ALL SEQUENCES IN SCHEMA app, auth, web, drizzle, public FROM :"backend", :"web";
ALTER DEFAULT PRIVILEGES FOR ROLE :"migrator" REVOKE ALL ON TABLES FROM :"backend", :"web";
ALTER DEFAULT PRIVILEGES FOR ROLE :"migrator" REVOKE ALL ON SEQUENCES FROM :"backend", :"web";
ALTER DEFAULT PRIVILEGES FOR ROLE :"migrator" IN SCHEMA app, auth, web REVOKE ALL ON TABLES FROM :"backend", :"web";
ALTER DEFAULT PRIVILEGES FOR ROLE :"migrator" IN SCHEMA app, auth, web REVOKE ALL ON SEQUENCES FROM :"backend", :"web";


-- backend: the app schema. Tables the migrator makes later get the same, so a new migration needs no grant.

GRANT USAGE ON SCHEMA app TO :"backend";
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA app TO :"backend";
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA app TO :"backend";
ALTER DEFAULT PRIVILEGES FOR ROLE :"migrator" IN SCHEMA app GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO :"backend";
ALTER DEFAULT PRIVILEGES FOR ROLE :"migrator" IN SCHEMA app GRANT USAGE, SELECT ON SEQUENCES TO :"backend";

-- The record of what admins did is append only (docs/ADMIN.md, section 8).
SELECT format('REVOKE UPDATE, DELETE, TRUNCATE ON app.admin_audit FROM %I', :'backend')
WHERE to_regclass('app.admin_audit') IS NOT NULL
\gexec

-- backend reads only what AuthIdentityDao uses: the admin user list (email, last sign-in) and the session
-- retention job (deletes expired sessions, clears old addresses). No password hash, key or other login data,
-- and no delete of a login: Next.js deletes logins, and the erasure replay runs as the migrator (docs/AUTH.md, 7.4).
GRANT USAGE ON SCHEMA auth TO :"backend";

SELECT format('GRANT SELECT (id, email, last_login_at) ON auth."user" TO %I', :'backend')
WHERE to_regclass('auth."user"') IS NOT NULL
\gexec

SELECT format('GRANT SELECT (user_id, created_at, updated_at, expires_at, ip_address), UPDATE (ip_address), DELETE '
              'ON auth.session TO %I', :'backend')
WHERE to_regclass('auth.session') IS NOT NULL
\gexec


-- web: the auth and web schemas, now and later.

GRANT USAGE ON SCHEMA auth, web TO :"web";
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA auth, web TO :"web";
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA auth, web TO :"web";
ALTER DEFAULT PRIVILEGES FOR ROLE :"migrator" IN SCHEMA auth, web GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO :"web";
ALTER DEFAULT PRIVILEGES FOR ROLE :"migrator" IN SCHEMA auth, web GRANT USAGE, SELECT ON SEQUENCES TO :"web";

-- The login delete and the sensitive action guard only ask whether an id has an erasure tombstone.
GRANT USAGE ON SCHEMA app TO :"web";

SELECT format('GRANT SELECT (user_id) ON app.erasure_ledger TO %I', :'web')
WHERE to_regclass('app.erasure_ledger') IS NOT NULL
\gexec

COMMIT;

\echo database roles: :migrator, :backend and :web are set up
