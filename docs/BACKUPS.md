# Backups

How production data is copied off the server: the database, user photos and Dokploy's own configuration, encrypted, to one Cloudflare R2 bucket, plus the erasure markers that keep a restore from bringing deleted accounts back. The plan and its decisions are tracked in [#486](https://github.com/OffCrazyFreak/Disscount/issues/486); the research behind where the jobs run is summarised under [Why a sidecar](#why-a-sidecar).

> ⚠️ **Status:** the sidecar is built but not running anywhere yet. It starts on production once production deploys from `docker-compose.images.yml` (#74) and the owner steps below are done. Until then, the Dokploy backups described in [INFRASTRUCTURE.md](INFRASTRUCTURE.md) are the only ones.

## What it is

A small container, `backup`, that runs next to the app in `docker-compose.images.yml`. CI builds its image (`ghcr.io/offcrazyfreak/disscount-backup`) with the frontend, migrator and backend images, so it is tagged, deployed and rolled back with them. Inside, [supercronic](https://github.com/aptible/supercronic) (cron built for containers) runs `backup-job` on the schedule in `backup/crontab`.

The jobs only ever add files to the bucket. Deleting old backups is left to R2 lifecycle rules, and R2 Bucket Lock stops anyone, including someone holding a leaked key, from deleting or overwriting a backup before its lock ends.

## Schedule and retention

Times are UTC.

| Job               | When         | What                                                                                     | Kept in R2              |
| ----------------- | ------------ | ---------------------------------------------------------------------------------------- | ----------------------- |
| `db-hourly`       | minute 17    | `pg_dump` of the app database, age-encrypted                                             | 2 days (about 48 dumps) |
| `db-nightly`      | 01:47        | the same dump plus role globals, then a scratch restore that checks the user count       | 30 days                 |
| `photos`          | minute 37    | new card photos, product originals and public product photos, through rclone crypt       | 30 days per file        |
| `dokploy`         | 02:27        | Dokploy's own database and `/etc/dokploy` (without cloned repositories and deploy logs)  | 30 days                 |
| `erasure-markers` | every minute | one marker per account erased in the last 30 days, see [Erasure replay](#erasure-replay) | 30 days                 |

**Photo generations.** Photos are copied into a folder `gen-<n>`, where `n` is the number of whole 14-day periods since 1 January 1970. The first run in a new generation copies every photo, later runs only new files. Each file is deleted 30 days after it was copied, so two or three generations exist (at least two complete) as long as the job keeps running, and an erased photo leaves the backup within about 31 days (R2 deletes expired objects within about a day).

## Bucket layout

| Prefix          | Contents                                                          | Encryption                     | Lock    | Delete after |
| --------------- | ----------------------------------------------------------------- | ------------------------------ | ------- | ------------ |
| `db/hourly/`    | `<timestamp>.dump.age`                                            | age                            | 2 days  | 2 days       |
| `db/nightly/`   | `<timestamp>.dump.age`, `<timestamp>.globals.sql.age`             | age                            | 28 days | 30 days      |
| `photos/`       | `gen-<n>/private/...`, `gen-<n>/public/...` (names encrypted)     | rclone crypt                   | 28 days | 30 days      |
| `dokploy/`      | `<timestamp>.dump.age`, `<timestamp>.etc.tar.age`                 | age                            | 28 days | 30 days      |
| `_erasures/v1/` | `<HMAC>`, a small JSON `{"v":1,"scope":"account","erasedAt":...}` | none, the name is a keyed hash | 28 days | 30 days      |

A lock blocks every deletion until it ends, lifecycle rules included, so each prefix's lock is no longer than its expiry. Names carry a timestamp because a locked object cannot be overwritten, so a second run on the same day must never reuse a name.

## Key files

- `backup/Dockerfile`: `postgres:17-alpine` pinned by digest (same major as the `db` service, so the dump and the scratch restore match it) plus `rclone`, `age`, `openssl` (the marker HMAC), `bash`, `curl`, `tar`, `flock` and supercronic, whose download is checked against its published SHA-1. The digest pins the Alpine release, so rclone and age only change through a reviewed digest bump.
- `backup/crontab`: the schedule.
- `backup/bin/backup-entrypoint`: reads the secrets under `/run/secrets`, refuses to start if a required setting is missing, and configures rclone from environment variables (an S3 remote `r2` and a crypt remote `photos` on top of it).
- `backup/bin/backup-job`: one job per call. Each job takes a lock (a second run while one is going is skipped), pings healthchecks.io at start, success and failure, writes to a temp folder, and uploads only finished, non-empty files. The ping body carries only the job's own summary lines (file names, sizes, counts), never tool output, which can quote database rows; full output is in the container log.
- `docker-compose.images.yml`: the `backup` service, the `photos-private` and `photos-public` volumes, and the secrets.
- `.github/workflows/ci.yml` and `.github/actions/dokploy-deploy/action.yml`: build and tag the image.

## Configuration

All settings live in the Dokploy production compose environment. The secret ones reach the container as Compose secrets, files under `/run/secrets/`, so they do not show in `docker inspect`. Placeholders are in the root `.env.example`.

| Variable                       | Secret | What                                                                             |
| ------------------------------ | ------ | -------------------------------------------------------------------------------- |
| `COMPOSE_PROFILES`             | no     | `backup` on production only; the service does not exist anywhere else            |
| `BACKUP_R2_ENDPOINT`           | no     | the EU endpoint, `https://<ACCOUNT_ID>.eu.r2.cloudflarestorage.com`              |
| `BACKUP_R2_BUCKET`             | no     | the backup bucket                                                                |
| `BACKUP_R2_ACCESS_KEY_ID`      | no     | key id of a token scoped to that bucket, Object Read & Write                     |
| `BACKUP_R2_SECRET_ACCESS_KEY`  | yes    | its secret                                                                       |
| `BACKUP_CRYPT_PASSWORD`        | yes    | rclone crypt password for photos                                                 |
| `BACKUP_CRYPT_SALT`            | yes    | rclone crypt salt (`password2`)                                                  |
| `BACKUP_AGE_RECIPIENT`         | no     | age public key (`age1...`); the private key stays offline with the owner         |
| `BACKUP_HEALTHCHECKS_PING_KEY` | yes    | healthchecks.io project ping key; blank sends no pings                           |
| `BACKUP_DOKPLOY_DB_PASSWORD`   | yes    | password of Dokploy's database user `dokploy`                                    |
| `BACKUP_ERASURE_HMAC_KEY`      | yes    | key of the erasure markers, 64 lowercase hex characters (`openssl rand -hex 32`) |

The app database settings (`POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`) are the ones the `db` service already uses.

> ⚠️ **Every secret variable must exist in the Dokploy environment once the profile is on, even if blank** (`BACKUP_HEALTHCHECKS_PING_KEY=` is fine). Compose refuses to start the whole stack, app included, when a variable a secret reads from is missing.

`BACKUP_DOKPLOY_DB_PASSWORD` is the password Dokploy generated at install. It lives in the Swarm secret `dokploy_postgres_password`, which only Dokploy's own containers can read: copy it once from `docker exec <dokploy-postgres container> cat /run/secrets/postgres_password` on the server into the Dokploy variable, without printing it anywhere else.

> ⚠️ **Keep the crypt password, the crypt salt and the age private key somewhere outside the server** (a password manager). They are the only way to read the backups; losing them loses every backup, and the server is exactly what a backup must survive.

## Owner setup (once, before production runs it)

1. **R2 bucket:** create an EU-jurisdiction bucket for backups only, and an Account API token with Object Read & Write limited to it. Cloudflare docs: [create buckets](https://developers.cloudflare.com/r2/buckets/create-buckets/), [API tokens](https://developers.cloudflare.com/r2/api/tokens/).
2. **Bucket Lock rules** per prefix, from the table above: `db/hourly/` 2 days; `db/nightly/`, `photos/`, `dokploy/` and `_erasures/` 28 days. Cloudflare docs: [bucket locks](https://developers.cloudflare.com/r2/buckets/bucket-locks/).
3. **Lifecycle rules** per prefix: `db/hourly/` delete after 2 days; the other four after 30 days. Cloudflare docs: [object lifecycles](https://developers.cloudflare.com/r2/buckets/object-lifecycles/).
4. **Keys:** generate an age key pair (`age-keygen`), two long random strings for the crypt password and salt, and the erasure marker key (`openssl rand -hex 32`); store all four offline.
5. **healthchecks.io:** create a project and copy its ping key. The five checks (`disscount-db-hourly`, `disscount-db-nightly`, `disscount-photos`, `disscount-dokploy`, `disscount-erasure-markers`) create themselves on the first ping; then set each one's period to match the schedule (1 hour, 1 day, 1 hour, 1 day, 1 minute) with a grace time, and turn on email alerts. Docs: [HTTP API](https://healthchecks.io/docs/http_api/).
6. **GHCR:** after CI first pushes `disscount-backup`, make the package public like the other three, so the server can pull it without credentials.
7. **Dokploy:** set the variables above on the production compose service and redeploy.

## Restore

**Database:** download a dump, decrypt it with the age private key, and restore into a fresh database.

```bash
rclone copy r2:<bucket>/db/nightly/<timestamp>.dump.age .
age -d -i key.txt -o db.dump <timestamp>.dump.age
pg_restore --list db.dump              # sanity check
pg_restore --clean --if-exists --no-owner -d "$DATABASE_URL" db.dump
```

Decrypt and restore `<timestamp>.globals.sql.age` first on a new server if roles are missing. After any restore, and before traffic reopens, run the [erasure replay](#erasure-replay).

**Photos:** with an rclone config that has the same `r2` and `photos` (crypt) remotes and the same password and salt, `rclone copy photos:gen-<n>/private <photo folder>` and the same for `public`. Use the newest generation once its first copy has finished, which it has when its file count (`rclone size photos:gen-<n>`) is at least the previous generation's; otherwise use the one before. The newest holds everything the previous one does plus newer files, while an older one also holds photos deleted since.

**Checking restored card photos:** `wallet_card_photo.sha256` is a version id, not the file's hash. With a thumbnail it is the SHA-256 of `<full file hash>:<thumb file hash>`, so a check recomputes it from both files.

**Dokploy:** decrypt `<timestamp>.dump.age` and `<timestamp>.etc.tar.age` the same way, restore the dump into Dokploy's database and unpack the tar into `/etc/dokploy`, then redeploy the services to clone their repositories again.

## Erasure replay

A dump made before someone deleted their account still holds that account, so a restore would bring it back. The `erasure_ledger` row that records the deletion is in the database too, so it is lost with it. The markers keep that record outside the database: every minute the `erasure-markers` job writes one object per ledger row from the last 30 days that has none yet. Every dump a restore can use is at most 30 days old, so an older erasure is already inside all of them. A marker is named by `HMAC-SHA256(key, "<scope>:<user id>")` in hex, so someone reading the bucket cannot tell who left; `v1` is the key version, so a new key can start `v2` without a flag day. The job never overwrites a marker, because a locked one cannot be.

The replay is a one-shot run of the backend image with the `erasure-replay` profile: no web server and no scheduled jobs. For every restored login or active profile whose marker exists, it runs the same `AccountErasureService` as a live deletion, then deletes the login the way better-auth would. It logs how many accounts it erased again, and fails, so the process exits non-zero, if the key is malformed, the folder holds anything but marker files, or the folder is empty. An empty folder looks the same as a failed download, so when no account was deleted in the last 30 days, add `--erasure-replay.allow-empty=true`. Run it once the database and photos are restored and before the app takes traffic, because a person signing in first would see their deleted account back:

```bash
rclone copy r2:<bucket>/_erasures/v1 ./erasures   # no crypt, the names are already hashes
read -rs key && printf '%s' "$key" > hmac.key && unset key   # paste BACKUP_ERASURE_HMAC_KEY; stays out of shell history
docker compose -f docker-compose.images.yml run --rm --no-deps \
  -v "$PWD/erasures:/replay/markers:ro" -v "$PWD/hmac.key:/replay/hmac.key:ro" \
  backend --spring.profiles.active=erasure-replay \
  --erasure-replay.markers=/replay/markers --erasure-replay.key-file=/replay/hmac.key
rm hmac.key
```

Both mounts must be readable by the image's `appuser`. Erasures newer than both the last dump and the last marker (at most a minute) are lost with the server, like any other data from that minute. R2 deletes an expired object within about a day, not to the minute, so a dump can outlive the marker written after it by up to a day; the owner accepted that rather than keeping markers longer than 30 days.

## Why a sidecar

Researched 4 November 2026 and decided by the owner. Dokploy schedules were rejected because the scheduler has open bugs where jobs never register (Dokploy #5403), fail silently (#5044) or are marked Cancelled after an update (#4986), and failures carry no logs (#3168). Installing the tools on the server would drift with system updates and live outside git. GitHub Actions would need the database reachable from GitHub. Running backups as a container next to the app is the common pattern for Docker Compose and Kamal deployments (for example prodrigestivill/postgres-backup-local and crmne/kamal-backup).

## Gotchas

- **Dev is not backed up** by decision; it never sets `COMPOSE_PROFILES=backup`, so the service does not exist there.
- **Rollback:** commits from before the backup image have none, so the deploy action leaves the backup tag where it is when rolling back to one.
- **A deploy replaces the container.** supercronic waits for a running job on shutdown, and `stop_grace_period` is 10 minutes; a job cut off anyway fails its ping and the next run starts clean.
- **The container runs as root** to read `/etc/dokploy`, which holds root-only SSH keys. It mounts nothing writable from the host and has no Docker socket. The scratch restore runs as `postgres`.
- **Photo volumes:** in `docker-compose.images.yml` the backend and the backup sidecar mount the same `photos-private` and `photos-public` volumes, so every photo the backend writes on disk is in the hourly copy. Before photos move to disk (`PHOTO_DIR` and `PUBLIC_PHOTO_DIR` blank) the volumes are empty; the job then copies nothing and still succeeds. A missing mount fails the job.
- **Dokploy backups are older than the markers cover.** Until they retire, the Dokploy Backups tab keeps dumps for 60 days. Markers cover only the last 30, so restoring one of those older dumps also needs the `erasure_ledger` rows of the newest sidecar dump erased by hand. Prefer a sidecar dump.
- **The first copy of a generation is the slow one.** Small files are bound by upload latency, so the job uploads 32 at a time. Measured on dev on 04.11.2026: 11 files a second with rclone's default 4, 46 with 16 and 93 with 32, so dev's 61,000 photo files take about 11 minutes. While it runs, the hourly photo runs skip.
- **Bucket Lock means no fixing mistakes by deleting:** a bad upload stays until its lock ends. Test changes on a separate bucket.

## Future work

- Retire the Dokploy Backups tab job and the Web Server backup once this has run cleanly for a week (#486).
- The dump before every production migration reuses this image (#74).
