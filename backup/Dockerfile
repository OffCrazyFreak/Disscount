# Backup sidecar: scheduled, encrypted copies of the database, photos and Dokploy config to R2.
# Same Postgres major as the db service, so pg_dump and the nightly scratch restore match it.
FROM postgres:17-alpine

# rclone and age come from the Alpine release the base image pins; supercronic is a checked download.
ARG SUPERCRONIC_VERSION=v0.2.51
ARG SUPERCRONIC_SHA1SUM=1692066e350a88ff4d7d6474fe3c7a6c41ec5e89

RUN apk add --no-cache bash curl rclone age tar util-linux \
    && curl -fsSLo /usr/local/bin/supercronic \
       "https://github.com/aptible/supercronic/releases/download/${SUPERCRONIC_VERSION}/supercronic-linux-amd64" \
    && echo "${SUPERCRONIC_SHA1SUM}  /usr/local/bin/supercronic" | sha1sum -c - \
    && chmod 755 /usr/local/bin/supercronic

COPY bin/ /usr/local/bin/
COPY crontab /etc/backup/crontab

# Root only to read the Dokploy config (root-owned SSH keys); the scratch restore drops to postgres.
ENTRYPOINT ["/usr/local/bin/backup-entrypoint"]
CMD ["supercronic", "-passthrough-logs", "/etc/backup/crontab"]
