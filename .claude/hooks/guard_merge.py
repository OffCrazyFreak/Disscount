"""`gh` commands that merge a pull request, allowed only once its required checks are green.

Agents log in as the repository owner, whose bypass on `dev` lets the REST merge
endpoint and `gh pr merge --admin` merge a red pull request. GitHub's own
mergeStateStatus is the answer here, because `gh pr checks --required` leaves out
a required check that has never reported.
"""

import json
import re
import subprocess

# BLOCKED is what GitHub reports for a required check that is red, pending or
# missing. UNSTABLE means only checks that are not required are failing.
MERGEABLE_STATES = {"CLEAN", "UNSTABLE", "HAS_HOOKS"}

MERGE_MUTATIONS = ("mergepullrequest", "enablepullrequestautomerge")

PR_MERGE_WITH_VALUE = {
    "-A", "--author-email", "-b", "--body", "-F", "--body-file",
    "--match-head-commit", "-R", "--repo", "-t", "--subject",
}

API_FIELD_FLAGS = ("-f", "-F", "--field", "--raw-field", "--input")

API_WITH_VALUE = {
    *API_FIELD_FLAGS, "-X", "--method", "-H", "--header", "-q", "--jq",
    "-t", "--template", "--hostname", "--cache", "-p", "--preview",
}

API_MERGE_PATH = re.compile(r"pulls/([^/?]+)/merge(?:[/?]|$)")

API_REPOSITORY = re.compile(r"repos/([^/{:]+/[^/{:]+)/pulls/")

SHELL_EXPANSION = re.compile(r"[$`*?~]")

# A variable ending the path can supply `pulls/N/merge`. One earlier in it, as in
# `repos/$R/issues/5/comments`, is left alone because agents write that all day.
VARIABLE_TAIL = re.compile(r"[$`][^/]*/?$")

UNREADABLE = (
    "Blocked: this merge command hides its target or its body, so the guard cannot "
    "check the pull request's required checks. Write the number and repository as "
    "plain text."
)


def pr_merge_target(args):
    """(pull request or None, repository or None) for the arguments after `gh pr merge`."""
    pull_request, repository = None, None
    index = 0

    while index < len(args):
        token = args[index]
        if token.startswith("--repo="):
            repository = token.split("=", 1)[1]
        elif token.startswith("-R") and len(token) > 2:
            repository = token[2:]
        elif token in ("-R", "--repo") and index + 1 < len(args):
            repository = args[index + 1]
        if token in PR_MERGE_WITH_VALUE:
            index += 2
            continue
        if not token.startswith("-") and pull_request is None:
            pull_request = token
        index += 1

    return pull_request, repository


def api_method(args):
    """The HTTP method `gh api` would use, which is POST once it has a body."""
    for index, token in enumerate(args):
        if token in ("-X", "--method") and index + 1 < len(args):
            return args[index + 1].upper()
        if token.startswith("--method="):
            return token.split("=", 1)[1].upper()
        if token.startswith("-X") and len(token) > 2:
            return token[2:].upper()

    has_body = any(token in API_FIELD_FLAGS or token.startswith("--input=") for token in args)
    return "POST" if has_body else "GET"


def graphql_refusal(args):
    if any(mutation in token.lower() for token in args for mutation in MERGE_MUTATIONS):
        return "Blocked: merge through `gh pr merge <number>`, so the guard can check the required checks."
    if any(token == "--input" or token.startswith("--input=") for token in args):
        return UNREADABLE
    # Query text always has a brace, so one without came from a variable or a file.
    if any(token.startswith("query=") and "{" not in token for token in args):
        return UNREADABLE
    return None


def api_positionals(args):
    """The arguments of `gh api` that are not options; the first is its endpoint."""
    positionals = []
    index = 0

    while index < len(args):
        if args[index] in API_WITH_VALUE:
            index += 2
            continue
        if not args[index].startswith("-"):
            positionals.append(args[index])
        index += 1

    return positionals


def merge_state(pull_request, repository, cwd):
    command = ["gh", "pr", "view", *([pull_request] if pull_request else [])]
    command += ["--json", "mergeStateStatus", *(["--repo", repository] if repository else [])]

    try:
        result = subprocess.run(command, cwd=cwd, capture_output=True, text=True, timeout=30)
        return json.loads(result.stdout)["mergeStateStatus"]
    except (OSError, subprocess.SubprocessError, ValueError, KeyError, TypeError):
        return None


def state_refusal(pull_request, repository, cwd, hidden):
    plain = [value for value in (pull_request, repository) if value]
    if hidden or any(SHELL_EXPANSION.search(value) for value in plain):
        return UNREADABLE
    if cwd is None and repository is None:
        return UNREADABLE

    state = merge_state(pull_request, repository, cwd)
    if state in MERGEABLE_STATES:
        return None

    return (
        f"Blocked: GitHub reports this pull request as {state or 'unknown'}, so a required "
        "check may be red, pending or missing. Wait until they are green, or ask the owner."
    )


def merge_refusal(args, cwd, hidden):
    """A refusal message for the arguments after `gh`, or None to allow.

    `hidden` means a substitution or xargs supplies text this guard cannot read.
    """
    if args[:2] == ["pr", "merge"]:
        pull_request, repository = pr_merge_target(args[2:])
        return state_refusal(pull_request, repository, cwd, hidden)

    if args[:2] == ["api", "graphql"]:
        return graphql_refusal(args[2:])

    if args[:1] != ["api"] or api_method(args[1:]) == "GET":
        return None

    positionals = api_positionals(args[1:])
    # A peeled substitution leaves its endpoint missing, torn in two, or with a gap.
    torn = len(positionals) != 1 or positionals[0].endswith("/") or " " in positionals[0]
    if hidden and torn:
        return UNREADABLE
    if not positionals:
        return None

    endpoint = positionals[0]
    if VARIABLE_TAIL.search(endpoint):
        return UNREADABLE

    match = API_MERGE_PATH.search(endpoint)
    if not match:
        return None
    if SHELL_EXPANSION.search(endpoint):
        return UNREADABLE

    repository = API_REPOSITORY.search(endpoint)
    return state_refusal(match.group(1), repository and repository.group(1), cwd, hidden)
