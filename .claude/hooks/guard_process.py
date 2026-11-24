"""`pkill -f` and `pgrep -f` patterns that match their own command line.

The shell running the command carries the whole command in its arguments, so a
plain pattern finds that shell: pkill kills the agent's own command, and a wait
loop on pgrep never ends.
"""

import re

PROCESS_TOOLS = {"pkill", "pgrep"}

# Options whose value is the next token.
WITH_VALUE = {
    "-d", "-g", "-G", "-P", "-s", "-t", "-u", "-U", "-F", "-T", "-A",
    "--delimiter", "--pgroup", "--group", "--parent", "--session", "--terminal",
    "--euid", "--uid", "--pidfile", "--signal", "--runstates", "--ns", "--nslist",
}

SHORT_FULL = re.compile(r"^-[a-zA-Z]*f[a-zA-Z]*$")


def full_pattern(args):
    """The pattern of a `-f` invocation, or None when it does not use `-f`."""
    full = False
    pattern = None
    skip_next = False

    for index, token in enumerate(args):
        if skip_next:
            skip_next = False
        elif token == "--":
            pattern = pattern or next(iter(args[index + 1 :]), None)
            break
        elif token in WITH_VALUE:
            skip_next = True
        elif token == "--full" or SHORT_FULL.match(token):
            full = True
        elif not token.startswith("-") and pattern is None:
            pattern = token

    return pattern if full else None


def matches_itself(pattern, command_line):
    if re.search(r"\$\{?\w", pattern):
        return True
    try:
        return re.search(pattern, command_line) is not None
    except re.error:
        return pattern in command_line


def process_match_refusal(tokens, wrapped, command_line):
    """A refusal for a self-matching pattern, or None to allow.

    `wrapped` means a wrapper's options may have hidden the real command, so
    the tool is searched for anywhere in the segment.
    """
    if tokens[0].rsplit("/", 1)[-1] in PROCESS_TOOLS:
        args = tokens[1:]
    elif wrapped:
        names = [token.rsplit("/", 1)[-1] for token in tokens]
        index = next((i for i, name in enumerate(names) if name in PROCESS_TOOLS), None)
        if index is None:
            return None
        args = tokens[index + 1 :]
    else:
        return None

    pattern = full_pattern(args)
    if pattern is None or not matches_itself(pattern, command_line):
        return None

    return (
        f"Blocked: the -f pattern `{pattern}` matches this command's own shell, so "
        "pkill would kill it and a pgrep loop would never end. Use the bracket "
        "trick (pgrep -f '[v]itest'), or find the PID (ss -ltnp for a port) and "
        "run kill <PID>."
    )
