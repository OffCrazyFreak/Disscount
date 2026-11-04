"""Git commands the guard refuses: skipping hooks, pushing to `main` or `dev`,
and branching from `origin/dev` with tracking.

`--no-verify` skips the hooks that keep formatting, trailers and dashes out of
commits. `main` only ever receives the release pull request from `dev`, and
`dev` only ever receives merged pull requests. This repository's machines set
push.default=upstream, so a branch that tracks origin/dev pushes straight to it.
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

# git accepts any unambiguous prefix of a long option; `--no-verb` would be
# `--no-verbose`, so a prefix must reach `--no-veri` to mean this flag.
NO_VERIFY_MIN = "--no-veri"

# These push every local branch, `main` included.
PUSH_EVERYTHING = {"--all", "--mirror", "--branches"}

PROTECTED = {"main", "dev"}

# A refspec whose destination is a protected branch: `dev`, `+dev`, `x:refs/heads/dev`, `:dev`.
PROTECTED_REF = re.compile(r"^\+?(?:[^:]*:)?(?:refs/heads/)?(main|dev)$")

UPSTREAM_DEV = "origin/dev"

# git only sets up tracking when the start point is exactly the remote branch,
# so `origin/dev~1` stays allowed.
DEV_START_POINT = re.compile(r"^(?:refs/remotes/|remotes/)?origin/dev$")

# Options that only exist to list branches, so an `origin/dev` next to them starts nothing.
BRANCH_NOT_CREATING = {
    "--list", "-l", "--merged", "--no-merged", "--contains", "--no-contains",
    "--points-at", "-a", "-r", "-d", "-D", "--delete", "-m", "-M", "-c", "-C",
    "--force", "-f",
}


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


def is_no_verify(token):
    return token.startswith(NO_VERIFY_MIN) and "--no-verify".startswith(token)


def options_of(args):
    """Arguments before `--`, after which everything is a path."""
    return args[: args.index("--")] if "--" in args else args


def skips_hooks(sub, args):
    args = options_of(args)
    if any(is_no_verify(token) for token in args):
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


def upstream_of(cwd):
    try:
        result = subprocess.run(
            ["git", "-C", cwd, "rev-parse", "--abbrev-ref", "@{upstream}"],
            capture_output=True,
            text=True,
            timeout=5,
        )
    except (OSError, subprocess.SubprocessError):
        return None

    return result.stdout.strip() if result.returncode == 0 else None


def refspecs_of(args):
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

    return positional[1:]


def protected_push_target(args, cwd):
    """The protected branch this push would land on, or None."""
    if any(token in PUSH_EVERYTHING for token in args):
        return "main"

    refspecs = refspecs_of(args)
    for ref in refspecs:
        match = PROTECTED_REF.match(ref)
        if match:
            return match.group(1)

    # `HEAD` sends the checked-out branch to its own name.
    if any(ref.lstrip("+") == "HEAD" for ref in refspecs):
        if cwd is None:
            return "main"
        branch = current_branch(cwd)
        return branch if branch in PROTECTED else None

    if refspecs:
        return None

    # A bare push follows push.default, which here means the upstream.
    if cwd is None:
        return "main"
    branch = current_branch(cwd)
    if branch in PROTECTED:
        return branch
    return "dev" if upstream_of(cwd) == UPSTREAM_DEV else None


def starts_tracking_dev(sub, args):
    """True when this creates a branch that would track origin/dev.

    `git branch -f` stays allowed: it repoints an existing branch, the after-merge
    pointer recipe uses it, and the bare-push check still catches its upstream.
    """
    args = options_of(args)
    if "--no-track" in args or not any(DEV_START_POINT.match(token) for token in args):
        return False

    if sub == "checkout":
        return any(token in {"-b", "-B", "-t", "--track"} for token in args)
    if sub == "switch":
        return any(token in {"-c", "-C", "--create", "--force-create", "-t", "--track"} for token in args)
    if sub == "worktree":
        return args[:1] == ["add"] and any(token in {"-b", "-B", "--track"} for token in args)
    if sub == "branch":
        if any(token in BRANCH_NOT_CREATING for token in args):
            return False
        return len([token for token in args if not token.startswith("-")]) >= 2

    return False


def disables_hooks(args, raw_tokens):
    """`HUSKY=0` before the command, or `-c core.hooksPath=...` as a git option."""
    if "git" in raw_tokens and "HUSKY=0" in raw_tokens[: raw_tokens.index("git")]:
        return True

    for index, token in enumerate(args):
        if token == "-c" and index + 1 < len(args):
            setting = args[index + 1]
        elif token.startswith("-c") and len(token) > 2:
            setting = token[2:]
        elif token.startswith("--config-env"):
            setting = token
        else:
            continue
        if "hookspath" in setting.lower():
            return True

    return False


def git_refusal(args, cwd, raw_tokens=()):
    """A refusal message for this `git` invocation, or None to allow."""
    raw_tokens = list(raw_tokens)
    sub, rest, cwd = split_global(args, cwd)

    if sub in HOOKED and (skips_hooks(sub, rest) or disables_hooks(args, raw_tokens)):
        return (
            "Blocked: --no-verify skips the hooks that keep formatting, trailers "
            "and dashes out of commits. Fix what the hook flags and commit again."
        )

    if sub == "push":
        target = protected_push_target(rest, cwd)
        if target:
            return (
                f"Blocked: this push lands on {target}. Work reaches dev and main "
                "only through pull requests. Name the destination: "
                "git push -u origin HEAD:refs/heads/<branch>."
            )

    if starts_tracking_dev(sub, rest):
        return (
            "Blocked: this branch would track origin/dev, and push.default=upstream "
            "then sends a bare push straight to dev. Add --no-track, e.g. "
            "git checkout --no-track -b <branch> origin/dev."
        )

    return None
