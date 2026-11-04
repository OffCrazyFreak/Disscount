---
name: worktree-checks
description: Sets up a Disscount git worktree to run the frontend and backend checks, the dev server, or a dependency change. Use when working in a linked worktree and a check, build, server or install is needed.
---

# Checks inside a worktree

Worktrees live under `/home/jj/.t3/worktrees/Disscount/<name>`. pnpm is blocked there by the guard hook, because it resolves through a symlinked `node_modules` and can purge the main checkout's copy.

## Git hooks

husky generates `frontend/.husky/_` only in the main checkout, so a new worktree has no hooks and commits skip the checks with no warning. The guard hook refuses `git commit` until this exists:

```bash
ln -s /home/jj/Desktop/Disscount/frontend/.husky/_ frontend/.husky/_
```

## Frontend checks

Link the main checkout's dependencies once, then call binaries directly from `frontend/`:

```bash
ln -s /home/jj/Desktop/Disscount/frontend/node_modules frontend/node_modules
cd frontend
./node_modules/.bin/next typegen
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/eslint src --max-warnings 0
./node_modules/.bin/vitest run
./node_modules/.bin/fallow audit --base origin/dev
node scripts/check-i18n.mjs
./node_modules/.bin/prettier --check src
./node_modules/.bin/prettier --check --ignore-path ../.prettierignore "../README.md" "../AGENTS.md" "../docs/**/*.md" "../.github/**/*.md" "../.agents/**/*.md"
```

The link is enough for the CLI checks and is gitignored. If the main checkout is behind on dependencies, a check can fail on a missing package; use the scratch clone below and link its `node_modules` instead.

## Dev server

Turbopack rejects the symlinked `node_modules`, so run `./node_modules/.bin/next dev --webpack`.

Gitignored env files may be missing from a new worktree. Copy `.env`, `backend/.env` and `frontend/.env.local` from `/home/jj/Desktop/Disscount/` when they are, and delete the copies when done. Stop the server by PID.

## Dependency change

The lockfile is regenerated in full for every dependency change, a single bump included, in a scratch clone at a literal path:

```bash
git clone --quiet /home/jj/Desktop/Disscount /home/jj/.t3/scratch/disscount-deps
cp frontend/package.json frontend/pnpm-workspace.yaml /home/jj/.t3/scratch/disscount-deps/frontend/
cd /home/jj/.t3/scratch/disscount-deps/frontend
rm -rf node_modules pnpm-lock.yaml .next
pnpm install
```

For a new package run `pnpm add <name>@<version>` there first. Copy `package.json`, `pnpm-lock.yaml` and `pnpm-workspace.yaml` back, run the checks with that clone's `node_modules` linked, list the unrelated updates in the PR body, and delete the clone.

## Backend

From `backend/`, `mvn -B verify` is the gate. It needs Docker running, for the Postgres schema test.
