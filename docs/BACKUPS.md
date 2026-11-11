# Backups

How production data is copied off the server: the database, user photos and Dokploy's own configuration, encrypted, to one Cloudflare R2 bucket, plus a database dump before every deploy and the erasure markers that keep a restore from bringing deleted accounts back. The plan and its decisions are tracked in [#486](https://github.com/OffCrazyFreak/Disscount/issues/486); the research behind where the jobs run is summarised under [Why a sidecar](#why-a-sidecar).

> ⚠️ **Status:** the sidecar is built but not running anywhere yet. It starts on production once production deploys from `docker-compose.images.yml` (#74) and the owner steps below are done. Until then, the only backup is the 7 day local dump schedule described in [INFRASTRUCTURE.md](INFRASTRUCTURE.md); the Dokploy R2 backups were removed on 05.11.2026.

## What it is

A small container, `backup`, that runs next to the app in `docker-compose.images.yml`. CI builds its image (`ghcr.io/offcrazyfreak/disscount-backup`) with the frontend, migrator and backend images, so it is tagged, deployed and rolled back with them. Inside, [supercronic](https://github.com/aptible/supercronic) (cron built for containers) runs `backup-job` on the schedule in `backup/crontab`.

The jobs only ever add files to the bucket. Deleting old backups is left to R2 lifecycle rules, and R2 Bucket Lock stops anyone, including someone holding a leaked key, from deleting or overwriting a backup before its lock ends.

## Schedule and retention

Times are UTC.

| Job               | When         | What                                                                                                                                         | Kept in R2              |
| ----------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| `db-hourly`       | minute 17    | `pg_dump` of the app database, age-encrypted                                                                                                 | 2 days (about 48 dumps) |
| `db-nightly`      | 01:47        | the same dump plus role globals, uploaded only after a scratch restore checks the user count; a failed restore leaves that night without one | 30 days                 |
| `photos`          | minute 37    | new card photos, product originals and public product photos, through rclone crypt                                                           | 30 days per file        |
| `dokploy`         | 02:27        | Dokploy's own database and `/etc/dokploy` (without cloned repositories and deploy logs)                                                      | 30 days                 |
| `erasure-markers` | every minute | one marker per account erased in the last 30 days, see [Erasure replay](#erasure-replay)                                                     | 30 days                 |

Every upload is checked: after each age file and each erasure marker the job compares the stored object's size and MD5 with the local file, and after each photo run `rclone cryptcheck` compares every newly copied photo with its local file through the crypt remote. Neither check downloads or decrypts anything (cryptcheck reads only the stored file's nonce, encrypts the local file with it and compares hashes). A mismatch fails the job, which healthchecks.io reports like any other failure. A bad upload stays in the bucket until its lock ends; the next run uploads a new dump, but a photo that failed its check is not copied again in the same generation. A run cut off between copying and checking (a deploy) leaves those photos unchecked, because the next run sees them as stored.

**Photo floor check.** The `photos` job fails when both photo volumes hold no files while the database has product photos that are not tombstones and have a full or original file (`product_image` rows with `deleted_at` empty and a `full_key` or `original_key`). An empty or wrong volume would otherwise copy nothing and still succeed. With no such rows, empty volumes pass. The ping carries both counts.

**Photo generations.** Photos are copied into a folder `gen-<n>`, where `n` is the number of whole 14-day periods since 1 January 1970. The first run in a new generation copies every photo, later runs only new files. Each file is deleted 30 days after it was copied, so two or three generations exist (at least two complete) as long as the job keeps running, and an erased photo leaves the backup within about 31 days (R2 deletes expired objects within about a day).

## Bucket layout

| Prefix          | Contents                                                                                | Encryption                     | Lock    | Delete after |
| --------------- | --------------------------------------------------------------------------------------- | ------------------------------ | ------- | ------------ |
| `db/hourly/`    | `<timestamp>.dump.age`                                                                  | age                            | 2 days  | 2 days       |
| `db/nightly/`   | `<timestamp>.dump.age`, `<timestamp>.globals.sql.age`, `predeploy-<timestamp>.dump.age` | age                            | 28 days | 30 days      |
| `photos/`       | `gen-<n>/private/...`, `gen-<n>/public/...` (names encrypted)                           | rclone crypt                   | 28 days | 30 days      |
| `dokploy/`      | `<timestamp>.dump.age`, `<timestamp>.etc.tar.age`                                       | age                            | 28 days | 30 days      |
| `_erasures/v1/` | `<HMAC>`, a small JSON `{"v":1,"scope":"account","erasedAt":...}`                       | none, the name is a keyed hash | 28 days | 30 days      |

The `predeploy-` dumps share `db/nightly/` for its 28 day lock and 30 day expiry; their prefix keeps a restore that takes the newest `<timestamp>.dump.age` from picking one by accident. A lock blocks every deletion until it ends, lifecycle rules included, so each prefix's lock is no longer than its expiry. Names carry a timestamp because a locked object cannot be overwritten, so a second run on the same day must never reuse a name.

## Dump before each deploy

The one-shot `predeploy-dump` service in `docker-compose.images.yml` runs on every deploy, and `flyway` (then drizzle's `migrate`) starts only after it has finished. Without `backup` in `COMPOSE_PROFILES` (dev, CI, local) it prints `predeploy-dump: backups off, no pre-deploy dump` and exits 0, with no ping. On production it runs `pg_dump` into a file, checks that the file is not empty and reads back, encrypts it with age, uploads it as `db/nightly/predeploy-<timestamp>.dump.age` and compares the stored size and MD5 with the local file. It skips the scratch restore that `db-nightly` runs, and it takes no globals.

**A failed dump only alerts** (owner decision 2026-11-11, "Alert only"). When any step fails (settings, dump, encryption, upload, check), or the whole run takes longer than 600 seconds (a hung `pg_dump` or R2 connection, reported as `timed out after 600 s`), the service prints `predeploy dump FAILED: <reason>`, sends a fail ping to the healthchecks.io check `disscount-predeploy-dump` and still exits 0, so `flyway`, `migrate` and the deploy go ahead. That deploy then relies on the last hourly dump, so up to about an hour of data is at risk if its migration goes wrong. A successful dump sends the success ping. Stopping the deploy instead would take production down: Compose has already removed the old containers of every service whose image or settings changed by the time the dump fails (tested locally on 2026-11-10).

With `BACKUP_HEALTHCHECKS_PING_KEY` blank no ping goes out, so a failed dump shows only in the Dokploy deployment log.

When the alert comes, read the `predeploy dump FAILED` line in the Dokploy deployment log, fix the cause (a setting, the token, R2), and press Redeploy if the next migration needs a fresh dump before it.

The check is created on its first ping (`?create=1`) with healthchecks.io's defaults, a 1 day period and 1 hour grace. Deploys are not daily, so its period must be raised to the longest healthchecks.io allows, or a quiet day reads as a missed run.

Its command is written in the compose file, not in `backup-job`. Dokploy reads the compose file from the branch tip while the images follow the moving tag, so a Rollback pairs this file with an older backup image; the command only needs tools every backup image has (`pg_dump`, `age`, `rclone`, `curl`, busybox `timeout`, `backup-entrypoint`).

The service has no profile, so `flyway` can always require it to finish first. That is why every environment that uses `docker-compose.images.yml` needs every `BACKUP_*` secret name, even blank (see [Configuration](#configuration)).

## Key files

- `backup/Dockerfile`: `postgres:17-alpine` pinned by digest (same major as the `db` service, so the dump and the scratch restore match it) plus `rclone`, `age`, `openssl` (the marker HMAC), `bash`, `curl`, `tar`, `flock` and supercronic, whose download is checked against its published SHA-1. The digest pins the Alpine release, so rclone and age only change through a reviewed digest bump.
- `backup/crontab`: the schedule.
- `backup/bin/backup-entrypoint`: reads the secrets under `/run/secrets`, refuses to start if a required setting is missing, and configures rclone from environment variables (an S3 remote `r2` and a crypt remote `photos` on top of it). It sets `PGOPTIONS=-c search_path=app,auth,public`, so the jobs' unqualified table names (`erasure_ledger`, `"user"`, `product_image`) resolve in the `app` and `auth` schemas since [#429](https://github.com/OffCrazyFreak/Disscount/issues/429) R11 moved them out of `public`, and the same names work with an older backup image after a Rollback; `pg_dump` and `pg_restore` set their own path. Write any new query unqualified the same way. The jobs log in as the owner (`POSTGRES_USER`), which reads every schema; the nightly scratch restore drops owners and grants (`--no-owner --no-acl`), so it needs none of the app's logins.
- `backup/bin/backup-job`: one job per call. Each job takes a lock (a second run while one is going is skipped), pings healthchecks.io at start, success and failure, writes to a temp folder, and uploads only finished files; database dumps must also be non-empty and readable, and every upload is checked against its local file (see [Schedule and retention](#schedule-and-retention)). Each successful `erasure-markers` run (every minute) touches `/tmp/backup-heartbeat`, and the container's healthcheck turns unhealthy when it has not succeeded for 5 minutes. The other jobs report through healthchecks.io. The ping body carries only the job's own summary lines (file names, sizes, counts), never tool output, which can quote database rows; full output is in the container log.
- `docker-compose.images.yml`: the `backup` service, the `predeploy-dump` service and its inline command, the `photos-private` and `photos-public` volumes, and the secrets.
- `.github/workflows/ci.yml` and `.github/actions/dokploy-deploy/deploy.sh`: build and tag the image.

## Configuration

All settings live in the Dokploy production compose environment. The secret ones reach the container as Compose secrets, files under `/run/secrets/`, so they do not show in `docker inspect`. Placeholders are in the root `.env.example`.

| Variable                       | Secret | What                                                                                                   |
| ------------------------------ | ------ | ------------------------------------------------------------------------------------------------------ |
| `COMPOSE_PROFILES`             | no     | `backup` on production only; elsewhere the sidecar does not exist and the pre-deploy dump skips itself |
| `BACKUP_R2_ENDPOINT`           | no     | the EU endpoint, `https://<ACCOUNT_ID>.eu.r2.cloudflarestorage.com`                                    |
| `BACKUP_R2_BUCKET`             | no     | the backup bucket                                                                                      |
| `BACKUP_R2_ACCESS_KEY_ID`      | no     | key id of a token scoped to that bucket, Object Read & Write                                           |
| `BACKUP_R2_SECRET_ACCESS_KEY`  | yes    | its secret                                                                                             |
| `BACKUP_CRYPT_PASSWORD`        | yes    | rclone crypt password for photos                                                                       |
| `BACKUP_CRYPT_SALT`            | yes    | rclone crypt salt (`password2`)                                                                        |
| `BACKUP_AGE_RECIPIENT`         | no     | age public key (`age1...`); the private key stays offline with the owner                               |
| `BACKUP_HEALTHCHECKS_PING_KEY` | yes    | healthchecks.io project ping key; blank sends no pings                                                 |
| `BACKUP_DOKPLOY_DB_PASSWORD`   | yes    | password of Dokploy's database user `dokploy`                                                          |
| `BACKUP_ERASURE_HMAC_KEY`      | yes    | key of the erasure markers, 64 lowercase hex characters (`openssl rand -hex 32`)                       |

The app database settings (`POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`) are the ones the `db` service already uses.

> ⚠️ **Every secret variable must exist in the Dokploy environment of every service that runs `docker-compose.images.yml`, dev included, even if blank** (`BACKUP_HEALTHCHECKS_PING_KEY=` is fine). `predeploy-dump` always exists and mounts the secrets, and Compose refuses to start it, so the app neither, when a variable a secret reads from is missing. `docker compose config -q` does not catch it; only `up` does.

`BACKUP_DOKPLOY_DB_PASSWORD` is the password Dokploy generated at install. It lives in the Swarm secret `dokploy_postgres_password`, which only Dokploy's own containers can read: copy it once from `docker exec <dokploy-postgres container> cat /run/secrets/postgres_password` on the server into the Dokploy variable, without printing it anywhere else.

> ⚠️ **Keep the crypt password, the crypt salt and the age private key somewhere outside the server** (a password manager). They are the only way to read the backups; losing them loses every backup, and the server is exactly what a backup must survive.

## Owner setup (once, before production runs it)

1. **R2 bucket:** create an EU-jurisdiction bucket for backups only, and an Account API token with Object Read & Write limited to it. Cloudflare docs: [create buckets](https://developers.cloudflare.com/r2/buckets/create-buckets/), [API tokens](https://developers.cloudflare.com/r2/api/tokens/).
2. **Bucket Lock rules** per prefix, from the table above: `db/hourly/` 2 days; `db/nightly/`, `photos/`, `dokploy/` and `_erasures/` 28 days. Cloudflare docs: [bucket locks](https://developers.cloudflare.com/r2/buckets/bucket-locks/).
3. **Lifecycle rules** per prefix: `db/hourly/` delete after 2 days; the other four after 30 days. Cloudflare docs: [object lifecycles](https://developers.cloudflare.com/r2/buckets/object-lifecycles/).
4. **Keys:** generate an age key pair (`age-keygen`), two long random strings for the crypt password and salt, and the erasure marker key (`openssl rand -hex 32`); store all four offline.
5. **healthchecks.io:** create a project and copy its ping key. Create the five checks by hand before the profile goes on (`disscount-db-hourly`, `disscount-db-nightly`, `disscount-photos`, `disscount-dokploy`, `disscount-erasure-markers`), because a container that never starts never pings, and a check that does not exist cannot go down. Set each one's period to match the schedule (1 hour, 1 day, 1 hour, 1 day, 1 minute) with a grace time, and turn on email alerts. The sixth, `disscount-predeploy-dump`, may be created the same way or by its first ping; either way its period goes to the longest allowed, because deploys have no schedule ([Dump before each deploy](#dump-before-each-deploy)). Docs: [HTTP API](https://healthchecks.io/docs/http_api/).
6. **Dokploy:** set the variables above on the production compose service and redeploy.

## Restore

**Database:** download a dump, decrypt it with the age private key, and restore into a fresh database.

```bash
rclone lsf r2:<bucket>/db/nightly/ | grep -v '^predeploy-'   # pick a timestamp; predeploy- dumps restore the same way
rclone copy r2:<bucket>/db/nightly/<timestamp>.dump.age .
age -d -i key.txt -o db.dump <timestamp>.dump.age
pg_restore --list db.dump              # sanity check
pg_restore --clean --if-exists -h <db host> -U "$POSTGRES_USER" -d "$POSTGRES_DB" db.dump   # as the owner, asks for POSTGRES_PASSWORD; keeps owners and grants
```

Restore as the owner (`POSTGRES_USER`), not as `DATABASE_URL`'s login, which may not create tables, and without `--no-owner`, so the tables stay the migrator's and keep the logins' grants ([INFRASTRUCTURE.md, Database roles](INFRASTRUCTURE.md#database-roles)). A dump from before [#429](https://github.com/OffCrazyFreak/Disscount/issues/429) R11 still has its tables in `public` (`pg_restore --list db.dump | grep -q ' TABLE public app_user '` finds it), and the roles script refuses that layout. Restore such a dump into an empty database, because `--clean` only drops what the dump holds, and the newer `app` and `auth` tables left behind would collide with `V6` and `0011`. Move the tables first by running both migration jobs once as the owner, whose tables they still are:

```bash
read -r owner && read -rs FLYWAY_PASSWORD && export FLYWAY_PASSWORD PGPASSWORD="$FLYWAY_PASSWORD"   # POSTGRES_USER and POSTGRES_PASSWORD
docker compose -f docker-compose.images.yml run --rm --no-deps -e FLYWAY_USER="$owner" -e FLYWAY_PASSWORD flyway
docker compose -f docker-compose.images.yml run --rm --no-deps -e PGUSER="$owner" -e PGPASSWORD migrate
unset FLYWAY_PASSWORD PGPASSWORD
```

On a new server, decrypt and restore `<timestamp>.globals.sql.age` first, which recreates the logins without their passwords. After any restore, run `db/database-roles.sql` again (it sets the three passwords and repairs any grant the dump lacked), then, before traffic reopens, the [erasure replay](#erasure-replay).

**Photos:** with an rclone config that has the same `r2` and `photos` (crypt) remotes and the same password and salt, `rclone copy photos:gen-<n>/private <photo folder>` and the same for `public`. Copy the previous generation first and the newest on top (only the newest if just one exists). The newest holds every photo still on disk when it started plus newer ones, but its first copy may not have finished; `copy` only adds and keys are unique per upload, so the two together miss nothing. Photos deleted since the older generation started come back as files no restored row points to; delete them before reopening.

**Checking restored card photos:** `wallet_card_photo.sha256` depends on the slot. For the icon, which has no thumbnail, it is the SHA-256 of the file. For the front and back it is the SHA-256 of `<full file hash>:<thumb file hash>`, so a check recomputes it from both files.

**Dokploy:** decrypt `<timestamp>.dump.age` and `<timestamp>.etc.tar.age` the same way, restore the dump into Dokploy's database and unpack the tar into `/etc/dokploy`, then redeploy the services to clone their repositories again.

## Erasure replay

A dump made before someone deleted their account still holds that account, so a restore would bring it back. The `erasure_ledger` row that records the deletion is in the database too, so it is lost with it. The markers keep that record outside the database: every minute the `erasure-markers` job writes one object per ledger row from the last 30 days that has none yet. Every dump a restore can use is at most 30 days old, so an older erasure is already inside all of them. A marker is named by `HMAC-SHA256(key, "<scope>:<user id>")` in hex, so someone reading the bucket cannot tell who left; `v1` is the key version, so a new key can start `v2` without a flag day. The job never overwrites a marker, because a locked one cannot be.

The replay is a one-shot run of the backend image with the `erasure-replay` profile: no web server and no scheduled jobs. For every restored login or active profile whose marker exists, it runs the same `AccountErasureService` as a live deletion, then deletes the login the way better-auth would. That delete (`ReplayIdentityDeletion`) is the only one left in Spring and exists only under this profile ([AUTH.md](AUTH.md#74-who-deletes-a-login)). It logs how many accounts it erased again, and fails, so the process exits non-zero, if the key is malformed, the folder holds anything but marker files, or the folder is empty. An empty folder looks the same as a failed download, so when no account was deleted in the last 30 days, add `--erasure-replay.allow-empty=true`. Run it once the database and photos are restored and before the app takes traffic, because a person signing in first would see their deleted account back:

```bash
rclone copy r2:<bucket>/_erasures/v1 ./erasures   # no crypt, the names are already hashes
read -rs key && printf '%s' "$key" > hmac.key && unset key   # paste BACKUP_ERASURE_HMAC_KEY; stays out of shell history
read -r SPRING_DATASOURCE_USERNAME && read -rs SPRING_DATASOURCE_PASSWORD   # MIGRATOR_DB_USERNAME and MIGRATOR_DB_PASSWORD
export SPRING_DATASOURCE_USERNAME SPRING_DATASOURCE_PASSWORD
docker compose -f docker-compose.images.yml run --rm --no-deps \
  -e SPRING_DATASOURCE_USERNAME -e SPRING_DATASOURCE_PASSWORD \
  -v "$PWD/erasures:/replay/markers:ro" -v "$PWD/hmac.key:/replay/hmac.key:ro" \
  backend --spring.profiles.active=erasure-replay \
  --erasure-replay.markers=/replay/markers --erasure-replay.key-file=/replay/hmac.key
rm hmac.key
```

The replay logs in as the migrator, because it deletes logins from `auth."user"` and the backend's own login may not; `-e NAME` without a value hands the container the shell's value, so the password never appears in the command. Both mounts must be readable by the image's `appuser`. Erasures newer than both the last dump and the last marker (at most a minute) are lost with the server, like any other data from that minute. R2 deletes an expired object within about a day, not to the minute, so a dump can outlive the marker written after it by up to a day; the owner accepted that rather than keeping markers longer than 30 days.

## Why a sidecar

Researched 4 November 2026 and decided by the owner. Dokploy schedules were rejected because the scheduler has open bugs where jobs never register (Dokploy #5403), fail silently (#5044) or are marked Cancelled after an update (#4986), and failures carry no logs (#3168). Installing the tools on the server would drift with system updates and live outside git. GitHub Actions would need the database reachable from GitHub. Running backups as a container next to the app is the common pattern for Docker Compose and Kamal deployments (for example prodrigestivill/postgres-backup-local and crmne/kamal-backup).

## Gotchas

- **Dev is not backed up** by decision; it never sets `COMPOSE_PROFILES=backup`, so the sidecar does not exist there and `predeploy-dump` only prints that backups are off.
- **Rollback:** commits from before the backup image have none, so the deploy action leaves the backup tag where it is when rolling back to one.
- **A deploy replaces the container.** supercronic waits for a running job on shutdown, and `stop_grace_period` is 10 minutes; a job Docker kills after that cannot ping or clean up, so healthchecks.io marks it down once its period and grace pass, and the next run starts clean.
- **The container runs as root** to read `/etc/dokploy`, which holds root-only SSH keys. It mounts nothing writable from the host and has no Docker socket. The scratch restore runs as `postgres`.
- **Photo volumes:** in `docker-compose.images.yml` the backend and the backup sidecar mount the same `photos-private` and `photos-public` volumes, so every photo the backend writes on disk is in the hourly copy. Before photos move to disk (`PHOTO_DIR` and `PUBLIC_PHOTO_DIR` blank) the volumes are empty, so the photo floor check fails the job while the database still lists photos with files; on production that alert is expected until the cutover copies the photo files onto the disk. A missing mount fails the job.
- **Run a job by hand through the entrypoint:** `docker exec <backup container> backup-entrypoint backup-job db-nightly`. A plain `docker exec ... backup-job` lacks the settings the entrypoint loads from `/run/secrets`.
- **The first copy of a generation is the slow one.** Small files are bound by upload latency, so the job uploads 32 at a time. Measured from the dev server into a throwaway drill bucket on 04.11.2026: 11 files a second with rclone's default 4, 46 with 16 and 93 with 32, so dev's 61,000 photo files take about 11 minutes. Those figures predate the upload check: the first copy now also runs `cryptcheck` over every file, which reads each stored file's header and the local file once more, so expect it to take longer (not measured yet). Over about 330,000 files the first copy passes an hour, and a deploy can cut it off; the next run carries on where it stopped. While it runs, the hourly photo runs skip.
- **Bucket Lock means no fixing mistakes by deleting:** a bad upload stays until its lock ends. Test changes on a separate bucket.
