#!/usr/bin/env python3
"""PreToolUse guard for Bash commands.

The permission rules in settings.json are prefix matches, so `Bash(pnpm dev:*)`
misses `pnpm --filter frontend dev` and `Bash(mvn spring-boot:run)` misses
`mvn -B spring-boot:run`. Every dev-server deny entry leaks the same way. This
closes all of them at once by parsing each command instead of matching a prefix.

It also blocks pnpm inside a git worktree: pnpm resolves the workspace through
the symlinked node_modules and offers to purge the MAIN tree's copy. It aborts
on a missing TTY today, so with CI=true set it would delete the real one.

A guard is only worth having if it cannot be stepped around, so parsing is
deliberately paranoid: it follows command substitutions, `sh -c` payloads, and
wrapper options, and it tracks `cd` so a later segment is judged by the
directory it actually runs in. Where a construct cannot be resolved, it blocks
rather than guessing.

Exit 0 allows, exit 2 blocks and shows the message to the agent.
"""

import json
import os
import re
import shlex
import subprocess
import sys

# Package managers and build tools whose args we inspect for a dev-server goal.
RUNNERS = {"pnpm", "npm", "yarn", "bun", "npx", "next", "mvn", "./mvnw", "mvnw"}

# Goals that start a long-running server. Matched against a runner's arguments,
# never against the raw string, so `grep -rn "pnpm dev"` stays allowed.
SERVER_GOALS = {"dev", "email", "spring-boot:run", "start"}

WRAPPERS = {"sudo", "timeout", "env", "nice", "nohup", "command", "time", "xargs"}

# Re-entering a shell hides the real command inside a string argument.
SHELLS = {"sh", "bash", "zsh", "dash", "ksh", "fish"}

ENV_ASSIGN = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*=")

# `$(...)` and backticks run their contents as a command.
SUBSTITUTION = re.compile(r"\$\(([^()]*)\)|`([^`]*)`")

# `<<'EOF'` / `<<"EOF"`. Only a QUOTED delimiter makes the body inert; an
# unquoted `<<EOF` still expands substitutions, so its body stays in scope.
QUOTED_HEREDOC = re.compile(r"<<-?\s*(['\"])(\w+)\1")

# Anything the shell expands at runtime, so its value is unknowable from here.
UNRESOLVABLE = re.compile(r"[$`*?~]|\$\{")

MAX_DEPTH = 5


def strip_heredocs(command):
    """Drop the bodies of quoted heredocs, which are data rather than commands.

    Without this, writing a commit message that quotes a blocked command (in
    backticks, as prose routinely does) blocks the commit. Only quoted
    delimiters are dropped, because an unquoted one still expands.
    """
    lines = command.split("\n")
    kept = []
    index = 0

    while index < len(lines):
        line = lines[index]
        kept.append(line)
        index += 1

        match = QUOTED_HEREDOC.search(line)
        if not match:
            continue

        terminator = match.group(2)
        while index < len(lines) and lines[index].strip() != terminator:
            index += 1
        if index < len(lines):
            index += 1

    return "\n".join(kept)


def substitutions(command):
    """Command strings hidden inside `$(...)` or backticks."""
    return [
        (match.group(1) or match.group(2)).strip()
        for match in SUBSTITUTION.finditer(command)
        if (match.group(1) or match.group(2) or "").strip()
    ]


def segments(command):
    """Split a compound command into individually executed pieces.

    Substitutions are peeled off first so their contents are checked as
    commands in their own right rather than surviving as an argument.

    The split tracks quoting, because a plain regex tears `sh -c "a && b"` in
    half and leaves both halves unparseable, which is a hole rather than a
    cosmetic bug. Peeling substitutions before this means one inside single
    quotes is still treated as live; blocking something inert is the safe way
    to be wrong.
    """
    text = SUBSTITUTION.sub(" ", command)
    parts, current, quote = [], [], None
    index = 0

    while index < len(text):
        char = text[index]

        if quote:
            current.append(char)
            quote = None if char == quote else quote
            index += 1
            continue

        if char in "'\"":
            quote = char
            current.append(char)
            index += 1
            continue

        if char == "\\" and index + 1 < len(text):
            current.extend(text[index : index + 2])
            index += 2
            continue

        if text[index : index + 2] in ("||", "&&"):
            parts.append("".join(current))
            current = []
            index += 2
            continue

        if char in "|;\n&":
            parts.append("".join(current))
            current = []
            index += 1
            continue

        current.append(char)
        index += 1

    parts.append("".join(current))

    return [part.strip() for part in parts if part.strip()]


def tokens_of(segment):
    try:
        return shlex.split(segment)
    except ValueError:
        return segment.split()


def strip_prefixes(tokens):
    """Drop env assignments and wrappers so the real command is first.

    Wrapper options are skipped too, but a flag that takes a separate value
    (`sudo -u root`, `nice -n 10`) is indistinguishable from a boolean one
    without a table per wrapper, so this can still stop on the wrong token.
    `wrapped` tells the caller to fall back to scanning the whole segment.
    """
    i = 0
    wrapped = False

    while i < len(tokens):
        token = tokens[i]

        if ENV_ASSIGN.match(token):
            i += 1
            continue

        if basename(token) in WRAPPERS:
            wrapped = True
            i += 1
            # Skip the wrapper's own options, plus timeout's leading duration.
            while i < len(tokens) and (
                tokens[i].startswith("-")
                or re.fullmatch(r"[\d.]+[smhd]?", tokens[i])
                or ENV_ASSIGN.match(tokens[i])
            ):
                i += 1
            continue

        break

    return tokens[i:], wrapped


def basename(token):
    return token.rsplit("/", 1)[-1] if "/" in token else token


def names_a_server(tokens):
    """True when these tokens invoke a runner with a dev-server goal."""
    for index, token in enumerate(tokens):
        if basename(token) not in RUNNERS and token not in RUNNERS:
            continue
        for arg in tokens[index + 1 :]:
            if arg.startswith("-"):
                continue
            if arg in SERVER_GOALS or arg.endswith(":run"):
                return True

    return False


def shell_payloads(tokens):
    """Strings a shell invocation would execute, e.g. the `-c` of `bash -c`."""
    payloads = []

    for index, token in enumerate(tokens):
        if token.startswith("--command="):
            payloads.append(token.split("=", 1)[1])
            continue
        if (
            token.startswith("-")
            and not token.startswith("--")
            and "c" in token[1:]
            and index + 1 < len(tokens)
        ):
            payloads.append(tokens[index + 1])

    return payloads


def resolve_cd(cwd, args):
    """The directory a `cd` lands in, or None when it cannot be known."""
    target = next((arg for arg in args if not arg.startswith("-")), None)

    if target is None:
        return os.path.expanduser("~")
    if UNRESOLVABLE.search(target):
        return None
    if target == "-":
        return None

    return os.path.normpath(os.path.join(cwd, target))


def _looks_like_worktree(cwd):
    """Fallback for when git cannot answer: this project's own convention."""
    return "/.claude/worktrees/" in cwd.replace(os.sep, "/") + "/"


def in_worktree(cwd):
    """True when cwd sits inside a LINKED git worktree.

    Asks git rather than matching the `/.claude/worktrees/` path convention,
    which only recognises the worktrees this project happens to create itself.
    A linked worktree's own git dir differs from the repository's common one.
    """
    try:
        result = subprocess.run(
            ["git", "-C", cwd, "rev-parse", "--git-dir", "--git-common-dir"],
            capture_output=True,
            text=True,
            timeout=5,
        )
    except (OSError, subprocess.SubprocessError):
        return _looks_like_worktree(cwd)

    if result.returncode != 0:
        return _looks_like_worktree(cwd)

    lines = [line for line in result.stdout.splitlines() if line.strip()]
    if len(lines) != 2:
        return _looks_like_worktree(cwd)

    git_dir, common_dir = (
        os.path.realpath(os.path.join(cwd, line.strip())) for line in lines
    )

    return git_dir != common_dir


def check(command, cwd, depth=0):
    """Return a refusal message, or None to allow."""
    if depth > MAX_DEPTH:
        return (
            "Blocked: command nests shells or substitutions too deeply to check.\n"
            "Rewrite it as a plain command so the guard can read it."
        )

    command = strip_heredocs(command)

    for nested in substitutions(command):
        message = check(nested, cwd, depth + 1)
        if message:
            return message

    # None means a `cd` landed somewhere unknowable, so cwd-dependent checks
    # can no longer be trusted for the rest of the command.
    effective_cwd = cwd

    for segment in segments(command):
        tokens, wrapped = strip_prefixes(tokens_of(segment))
        if not tokens:
            continue

        head = tokens[0]
        name = basename(head)
        args = tokens[1:]

        if name == "cd":
            effective_cwd = resolve_cd(effective_cwd, args)
            continue

        if name in SHELLS:
            for payload in shell_payloads(args):
                message = check(payload, effective_cwd or cwd, depth + 1)
                if message:
                    return message
            continue

        # A wrapper whose options we could not parse may have hidden the real
        # command, so judge the whole segment rather than just its head.
        if names_a_server(tokens if not wrapped else tokens_of(segment)):
            return (
                f"Blocked: `{segment}` starts a dev server or long-running app.\n"
                "AGENTS.md: the dev server is already running, so never start "
                "another. Prefix matching in settings.json missed this spelling, "
                "which is why this hook exists."
            )

        if name == "pnpm" or (wrapped and "pnpm" in [basename(t) for t in tokens]):
            if effective_cwd is None:
                return (
                    f"Blocked: `{segment}` runs pnpm after a `cd` this guard "
                    "cannot resolve, so it cannot tell whether the directory is a "
                    "git worktree. Run pnpm from a literal path instead."
                )
            if in_worktree(effective_cwd):
                return (
                    f"Blocked: `{segment}` runs pnpm inside a git worktree "
                    f"({effective_cwd}).\n"
                    "pnpm resolves the workspace through the symlinked node_modules "
                    "and will offer to purge the MAIN tree's copy. Call the binary "
                    "directly instead, e.g. ./node_modules/.bin/tsc --noEmit."
                )

    return None


def main():
    try:
        payload = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        sys.exit(0)  # Never block on a malformed payload.

    if not isinstance(payload, dict) or payload.get("tool_name") != "Bash":
        sys.exit(0)

    tool_input = payload.get("tool_input")
    command = (tool_input or {}).get("command") if isinstance(tool_input, dict) else None
    cwd = payload.get("cwd")

    if not isinstance(command, str) or not command.strip():
        sys.exit(0)
    if not isinstance(cwd, str) or not cwd:
        cwd = os.getcwd()

    message = check(command, cwd)
    if message:
        print(message, file=sys.stderr)
        sys.exit(2)

    sys.exit(0)


if __name__ == "__main__":
    main()
