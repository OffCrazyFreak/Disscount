#!/usr/bin/env python3
"""PreToolUse guard for Bash commands.

The permission rules in settings.json are prefix matches, so `Bash(pnpm dev:*)`
misses `pnpm --filter frontend dev` and `Bash(mvn spring-boot:run)` misses
`mvn -B spring-boot:run`. Every dev-server deny entry leaks the same way. This
closes all of them at once by parsing each command instead of matching a prefix.

It also blocks pnpm inside a git worktree: pnpm resolves the workspace through
the symlinked node_modules and offers to purge the MAIN tree's copy. It aborts
on a missing TTY today, so with CI=true set it would delete the real one.

Exit 0 allows, exit 2 blocks and shows the message to the agent.
"""

import json
import os
import re
import shlex
import sys

# Package managers and build tools whose args we inspect for a dev-server goal.
RUNNERS = {"pnpm", "npm", "yarn", "bun", "npx", "next", "mvn", "./mvnw", "mvnw"}

# Goals that start a long-running server. Matched against a runner's arguments,
# never against the raw string, so `grep -rn "pnpm dev"` stays allowed.
SERVER_GOALS = {"dev", "email", "spring-boot:run", "start"}

WRAPPERS = {"sudo", "timeout", "env", "nice", "nohup", "command", "time", "xargs"}

ENV_ASSIGN = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*=")


def segments(command):
    """Split a compound command into individually executed pieces."""
    return [s.strip() for s in re.split(r"\|\||&&|\||;|\n", command) if s.strip()]


def tokens_of(segment):
    try:
        return shlex.split(segment)
    except ValueError:
        return segment.split()


def strip_prefixes(tokens):
    """Drop env assignments and wrappers so the real command is first."""
    i = 0
    while i < len(tokens):
        token = tokens[i]
        if ENV_ASSIGN.match(token):
            i += 1
            continue
        if token in WRAPPERS:
            i += 1
            # timeout takes a duration before the command
            while i < len(tokens) and re.fullmatch(r"[\d.]+[smhd]?", tokens[i]):
                i += 1
            continue
        break
    return tokens[i:]


def basename(token):
    return token.rsplit("/", 1)[-1] if "/" in token else token


def in_worktree(cwd):
    return "/.claude/worktrees/" in cwd.replace(os.sep, "/") + "/"


def check(command, cwd):
    """Return a refusal message, or None to allow."""
    for segment in segments(command):
        tokens = strip_prefixes(tokens_of(segment))
        if not tokens:
            continue

        head = tokens[0]
        name = basename(head)
        args = tokens[1:]

        # `cd somewhere && real-command` is handled by the next segment.
        if name == "cd":
            continue

        if name in RUNNERS or head in RUNNERS:
            # A goal only counts as a bare argument, so `--filter dev-tools` and
            # `pnpm exec next lint` do not trip it.
            for arg in args:
                if arg.startswith("-"):
                    continue
                if arg in SERVER_GOALS or arg.endswith(":run"):
                    return (
                        f"Blocked: `{segment}` starts a dev server or long-running app.\n"
                        "AGENTS.md: the dev server is already running, so never start "
                        "another. Prefix matching in settings.json missed this spelling, "
                        "which is why this hook exists."
                    )

        if name == "pnpm" and in_worktree(cwd):
            return (
                f"Blocked: `{segment}` runs pnpm inside a git worktree ({cwd}).\n"
                "pnpm resolves the workspace through the symlinked node_modules and "
                "will offer to purge the MAIN tree's copy. Call the binary directly "
                "instead, e.g. ./node_modules/.bin/tsc --noEmit."
            )

    return None


def main():
    try:
        payload = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        sys.exit(0)  # Never block on a malformed payload.

    if payload.get("tool_name") != "Bash":
        sys.exit(0)

    command = (payload.get("tool_input") or {}).get("command") or ""
    cwd = payload.get("cwd") or os.getcwd()

    message = check(command, cwd)
    if message:
        print(message, file=sys.stderr)
        sys.exit(2)

    sys.exit(0)


if __name__ == "__main__":
    main()
