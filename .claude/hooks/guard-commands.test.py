#!/usr/bin/env python3
"""Cases the guard has to get right. Run: python3 .claude/hooks/guard-commands.test.py"""

import json
import os
import shutil
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
HOOK = os.path.join(HERE, "guard-commands.py")
MAIN = os.path.dirname(os.path.dirname(HERE))

# A path matching this project's own worktree convention. It need not exist:
# git cannot answer for it, so the guard falls back to the convention.
WT = os.path.join(MAIN, ".claude", "worktrees", "foo")


def build_real_worktree(root):
    """A genuine linked worktree, to prove detection does not rely on the path."""
    repo = os.path.join(root, "repo")
    os.makedirs(repo)
    env = {
        **os.environ,
        "GIT_AUTHOR_NAME": "t",
        "GIT_AUTHOR_EMAIL": "t@t",
        "GIT_COMMITTER_NAME": "t",
        "GIT_COMMITTER_EMAIL": "t@t",
    }
    run = lambda *a: subprocess.run(a, cwd=repo, env=env, capture_output=True, check=True)
    run("git", "init", "-q")
    open(os.path.join(repo, "f"), "w").close()
    run("git", "add", "f")
    run("git", "commit", "-qm", "init")
    linked = os.path.join(root, "linked")
    run("git", "worktree", "add", "-q", "-b", "wt", linked)

    return repo, linked


def cases(real_repo, real_worktree):
    return [
        # ALLOW: dev servers and Docker run in the main tree
        ("pnpm dev", MAIN, False),
        ("pnpm --filter frontend dev", MAIN, False),
        ("cd frontend && pnpm dev", MAIN, False),
        ("mvn -B spring-boot:run", MAIN, False),
        ("next dev", MAIN, False),
        ("docker compose up -d --build", MAIN, False),
        # BLOCK: wrapper flags that take a value used to hide the command
        ("sudo -u root pnpm install", WT, True),
        ("env -i pnpm install", WT, True),
        ("nice -n 10 pnpm install", WT, True),
        ("env FOO=bar pnpm install", WT, True),
        ("nohup pnpm install", WT, True),
        ("CI=true pnpm install", WT, True),
        ("timeout 30 pnpm install", WT, True),
        # BLOCK: re-entering a shell used to hide the command in a string
        ('bash -c "pnpm install"', WT, True),
        ("sh -c 'pnpm install'", WT, True),
        ('bash -lc "pnpm install"', WT, True),
        ('sh -c "cd frontend && pnpm install"', WT, True),
        # BLOCK: command substitution used to hide the command
        ("echo $(pnpm install)", WT, True),
        ("echo `pnpm install`", WT, True),
        # BLOCK: pnpm inside a worktree, by convention and by git metadata
        ("pnpm lint", WT, True),
        ("pnpm exec tsc --noEmit", WT, True),
        ("pnpm install", WT, True),
        ("pnpm install", real_worktree, True),
        ("pnpm exec tsc --noEmit", real_worktree, True),
        ("sudo -u root pnpm install", real_worktree, True),
        # BLOCK: cd into a worktree first, which used to keep the original cwd
        ("cd .claude/worktrees/foo && pnpm install", MAIN, True),
        (f"cd {real_worktree} && pnpm install", MAIN, True),
        # BLOCK: a cd whose target this guard cannot resolve
        ("cd $SOMEWHERE && pnpm install", MAIN, True),
        # ALLOW: the checks we actually run
        ("pnpm lint", MAIN, False),
        ("pnpm exec tsc --noEmit", MAIN, False),
        ("pnpm build", MAIN, False),
        ("mvn -B verify", MAIN, False),
        ("mvn -B -DskipTests package", MAIN, False),
        ("./node_modules/.bin/tsc --noEmit", WT, False),
        ("./node_modules/.bin/eslint src", WT, False),
        ("pnpm exec next lint", MAIN, False),
        ("./node_modules/.bin/next lint --fix", MAIN, False),
        ("cd frontend && pnpm lint", MAIN, False),
        # ALLOW: a real repo that is not a linked worktree
        ("pnpm install", real_repo, False),
        # ALLOW: a quoted heredoc body is data, so prose may quote a blocked command
        ("git commit -F - <<'EOF'\nfix: stop `pnpm install`\n\nWas `sh -c \"cd f && pnpm install\"`.\nEOF", WT, False),
        ("cat <<'SQL' > q.sql\nselect 'pnpm install';\nSQL", WT, False),
        # BLOCK: an UNQUOTED heredoc still expands, so its body is live
        ("cat <<EOF\n$(pnpm install)\nEOF", WT, True),
        # ALLOW: the word appears but nothing is executed
        ('grep -rn "pnpm install" docs/', WT, False),
        ('echo "run pnpm install yourself"', WT, False),
        ("git push origin dev", MAIN, False),
        ("git checkout dev", MAIN, False),
        ("git log --oneline dev", MAIN, False),
        ("gh pr create --base dev", MAIN, False),
        ("pnpm --filter dev-tools lint", MAIN, False),
    ]


def main():
    if not shutil.which("git"):
        print("git is required to run these tests")
        return 1

    root = tempfile.mkdtemp(prefix="guard-commands-")
    try:
        real_repo, real_worktree = build_real_worktree(root)
        fails = 0

        for command, cwd, expect_block in cases(real_repo, real_worktree):
            payload = json.dumps(
                {"tool_name": "Bash", "tool_input": {"command": command}, "cwd": cwd}
            )
            result = subprocess.run(
                [sys.executable, HOOK], input=payload, capture_output=True, text=True
            )
            blocked = result.returncode == 2
            ok = blocked == expect_block
            fails += 0 if ok else 1
            where = {MAIN: "main", WT: "wt-path", real_worktree: "wt-git"}.get(
                cwd, "repo"
            )
            print(
                f"{'ok  ' if ok else 'FAIL'} [{where:7}] "
                f"block={str(blocked):5} want={str(expect_block):5}  {command}"
            )

        print()
        print("FAILURES:", fails)

        return 1 if fails else 0
    finally:
        subprocess.run(["chmod", "-R", "u+w", root], capture_output=True)
        shutil.rmtree(root, ignore_errors=True)


if __name__ == "__main__":
    sys.exit(main())
