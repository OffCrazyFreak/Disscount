---
name: worktree-checks
description: Sets up a Disscount git worktree to run the frontend and backend checks, the dev server, or a dependency change. Use when working in a linked worktree and a check, build, server or install is needed.
---

# Checks inside a worktree

Worktrees live under `/home/jj/.t3/worktrees/Disscount/<name>`. Each one gets its own dependencies, so `pnpm` works there as in the main checkout.

## Install

The `t3.json` script runs this when T3 creates a worktree. Run it yourself when `frontend/node_modules` is missing:

```bash
cd frontend
pnpm install --frozen-lockfile
```

The guard hook blocks `pnpm` while `frontend/node_modules` is a symlink, because pnpm can purge the main checkout's copy through it. Delete the link with `rm frontend/node_modules` (no trailing slash), then install.

The install also generates `frontend/.husky/_`, the hook folder. The guard hook refuses `git commit` until it exists.

## Checks

From `frontend/`, run `pnpm check`. From `backend/`, run `mvn -B verify`, which needs Docker running for the Postgres schema test.

## Dev server

Run `pnpm dev` from `frontend/`, and stop it by PID.

Copy `.env`, `backend/.env` and `frontend/.env.local` from `/home/jj/Desktop/Disscount/` when T3 did not copy them, and delete the copies when done.

## Dependency change

Regenerate the lockfile in full for every dependency change, a single bump included. From `frontend/`:

```bash
rm -rf node_modules pnpm-lock.yaml .next
pnpm install
```

For a new package, run `pnpm add <name>@<version>` first. List the unrelated updates in the PR body.
