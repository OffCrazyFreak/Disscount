"""Git commands the guard refuses: skipping hooks, and pushing to `main`.

`--no-verify` skips the hooks that keep formatting, trailers and dashes out of
commits. `main` only ever receives the release pull request from `dev`.
"""

import os
import re
import subprocess

# Global options that consume the next token, e.g. `git -C dir commit`.
GLOBAL_WITH_VALUE = {"-C", "-c", "--git-dir", "--work-tree", "--namespace"}

HOOKED = {"commit", "push", "merge", "rebase", "am", "cherry-pick", "revert"}

# `git commit` options whose value is the next token, or attached (`-mfoo`).
COMMIT_WITH_VALUE = {"-m", "-F", "-C", "-c", "-t", "--message", "--file", "--author", "--date", "--template"}

PUSH_WITH_VALUE = {"-o", "--push-option", "--repo", "--receive-pack", "--exec"}

MAIN_REF = re.compile(r"^\+?(?:[^:]*:)?(?:refs/heads/)?main$")


def split_global(args, cwd):
    """The subcommand, its arguments, and the directory `-C` points git at."""
    index = 0
    while index < len(args):
        token = args[index]
        if token in GLOBAL_WITH_VALUE:
            if token == "-C" and cwd is not None and index + 1 < len(args):
                cwd = os.path.normpath(os.path.join(cwd, args[index + 1]))
            index += 2
            continue
        if token.startswith("-"):
            index += 1
            continue
        return token, args[index + 1 :], cwd

    return None, [], cwd


def skips_hooks(sub, args):
    if "--no-verify" in args:
        return True
    if sub != "commit":
        return False

    skip_next = False
    for token in args:
        if skip_next:
            skip_next = False
            continue
        if token in COMMIT_WITH_VALUE:
            skip_next = True
            continue
        if token.startswith("--") or not token.startswith("-"):
            continue
        # A short cluster such as `-an`; `-m` or `-F` ends it with an attached value.
        flags = re.split(r"[mFCct]", token[1:], maxsplit=1)[0]
        if "n" in flags:
            return True

    return False


def current_branch(cwd):
    try:
        result = subprocess.run(
            ["git", "-C", cwd, "rev-parse", "--abbrev-ref", "HEAD"],
            capture_output=True,
            text=True,
            timeout=5,
        )
    except (OSError, subprocess.SubprocessError):
        return None

    return result.stdout.strip() if result.returncode == 0 else None


def pushes_main(args, cwd):
    positional = []
    skip_next = False
    for token in args:
        if skip_next:
            skip_next = False
            continue
        if token in PUSH_WITH_VALUE:
            skip_next = True
            continue
        if not token.startswith("-"):
            positional.append(token)

    refspecs = positional[1:]
    if any(MAIN_REF.match(ref) for ref in refspecs):
        return True

    # A bare push, or `HEAD`, sends whatever is checked out.
    if not refspecs or any(ref.lstrip("+") == "HEAD" for ref in refspecs):
        return cwd is None or current_branch(cwd) == "main"

    return False


def git_refusal(args, cwd):
    """A refusal message for this `git` invocation, or None to allow."""
    sub, rest, cwd = split_global(args, cwd)

    if sub in HOOKED and skips_hooks(sub, rest):
        return (
            "Blocked: --no-verify skips the hooks that keep formatting, trailers "
            "and dashes out of commits. Fix what the hook flags and commit again."
        )

    if sub == "push" and pushes_main(rest, cwd):
        return (
            "Blocked: pushing to main. Only the release pull request from dev "
            "reaches main; push your branch and open a pull request into dev."
        )

    return None
