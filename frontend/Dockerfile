# syntax=docker/dockerfile:1

# ---- Base: Node + pinned pnpm ----
FROM node:24-slim AS base
RUN npm install -g pnpm@11.9.0
WORKDIR /app

# ---- deps: install all dependencies, cached on the lockfile ----
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# --ignore-scripts: skip lifecycle scripts (pnpm 11 otherwise errors on unapproved build
# scripts with no interactive approve-builds in Docker). The packages that have build scripts
# (sharp, esbuild, etc.) ship prebuilt platform binaries via optional deps, and the rest
# (@sentry/cli download, openapi-generator-cli, core-js) aren't needed to build the app.
RUN pnpm install --frozen-lockfile --ignore-scripts

# ---- build: produce the Next.js standalone output ----
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Public build args — REAL values, inlined into the client bundle at build time.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ARG NEXT_PUBLIC_UMAMI_WEBSITE_ID
ARG NEXT_PUBLIC_ENABLE_REACT_SCAN
ARG NEXT_PUBLIC_SENTRY_DSN
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID \
    NEXT_PUBLIC_UMAMI_WEBSITE_ID=$NEXT_PUBLIC_UMAMI_WEBSITE_ID \
    NEXT_PUBLIC_ENABLE_REACT_SCAN=$NEXT_PUBLIC_ENABLE_REACT_SCAN \
    NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN

ENV NEXT_TELEMETRY_DISABLED=1

# Placeholder SERVER env, scoped to the build command only (not persisted as image
# metadata). They satisfy modules that requireEnv() at import time; none are NEXT_PUBLIC,
# so nothing is baked into the output — real values come from the container at runtime.
# (No SENTRY_AUTH_TOKEN is set, so source maps are not uploaded during the image build.)
RUN BETTER_AUTH_URL=http://localhost:3000 \
    BETTER_AUTH_SECRET=build-time-placeholder \
    GOOGLE_CLIENT_SECRET=build-time-placeholder \
    FACEBOOK_CLIENT_ID=build-time-placeholder \
    FACEBOOK_CLIENT_SECRET=build-time-placeholder \
    RESEND_API_KEY=build-time-placeholder \
    EMAIL_FROM=build@example.com \
    CIJENE_API_URL=http://localhost \
    DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder \
    pnpm build

# ---- runner: minimal runtime image with the standalone server ----
FROM base AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
WORKDIR /app

RUN useradd -r -u 1001 -m nextjs

# Standalone server bundle + static assets + public dir (the three pieces a
# standalone Next.js app needs at runtime). --chown so the non-root user owns .next
# and can write the runtime image/ISR cache (/app/.next/cache).
COPY --from=build --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nextjs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nextjs /app/public ./public

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
