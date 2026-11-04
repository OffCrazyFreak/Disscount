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
# The main checkout even when this runs from a linked worktree, where pnpm is blocked.
MAIN = os.path.dirname(
    subprocess.run(
        ["git", "-C", HERE, "rev-parse", "--path-format=absolute", "--git-common-dir"],
        capture_output=True,
        text=True,
        check=True,
    ).stdout.strip()
)

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
    run("git", "init", "-q", "-b", "dev")
    open(os.path.join(repo, "f"), "w").close()
    run("git", "add", "f")
    run("git", "commit", "-qm", "init")
    linked = os.path.join(root, "linked")
    run("git", "worktree", "add", "-q", "-b", "wt", linked)
    on_main = os.path.join(root, "on-main")
    run("git", "worktree", "add", "-q", "-b", "main", on_main)
    # A branch tracking origin/dev is what push.default=upstream sends to dev.
    remote = os.path.join(root, "remote.git")
    run("git", "init", "-q", "--bare", remote)
    run("git", "remote", "add", "origin", remote)
    run("git", "push", "-q", "origin", "dev")
    tracks_dev = os.path.join(root, "tracks-dev")
    run("git", "worktree", "add", "-q", "--track", "-b", "feat-a", tracks_dev, "origin/dev")
    tracks_own = os.path.join(root, "tracks-own")
    run("git", "worktree", "add", "-q", "--no-track", "-b", "feat-b", tracks_own, "origin/dev")
    subprocess.run(["git", "push", "-qu", "origin", "feat-b"], cwd=tracks_own, env=env, capture_output=True, check=True)

    # husky's generated hook folder exists only in the checkout that installed it.
    no_hooks = os.path.join(root, "no-hooks")
    run("git", "init", "-q", "-b", "dev", no_hooks)
    run("git", "-C", no_hooks, "config", "core.hooksPath", "hooks/_")
    with_hooks = os.path.join(root, "with-hooks")
    run("git", "init", "-q", "-b", "dev", with_hooks)
    run("git", "-C", with_hooks, "config", "core.hooksPath", "hooks/_")
    os.makedirs(os.path.join(with_hooks, "hooks", "_"))

    return repo, linked, on_main, tracks_dev, tracks_own, no_hooks, with_hooks


def cases(real_repo, real_worktree, on_main, tracks_dev, tracks_own, no_hooks, with_hooks):
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
        ("git checkout dev", MAIN, False),
        ("git log --oneline dev", MAIN, False),
        ("gh pr create --base dev", MAIN, False),
        ("pnpm --filter dev-tools lint", MAIN, False),
        # BLOCK: skipping the git hooks, however it is spelled
        ('git commit --no-verify -m "x"', real_repo, True),
        ('git commit -n -m "x"', real_repo, True),
        ('git commit -anm "x"', real_repo, True),
        ("git push --no-verify origin dev", real_repo, True),
        ("git -C frontend merge --no-verify dev", real_repo, True),
        ('env CI=1 git commit --no-verify -m "x"', real_repo, True),
        ("bash -c 'git commit --no-verify -m x'", real_repo, True),
        ('git commit --no-verif -m "x"', real_repo, True),
        ('git commit --no-veri -m "x"', real_repo, True),
        ('git commit --no-verb -m "x"', real_repo, False),
        ('HUSKY=0 git commit -m "x"', real_repo, True),
        ('env HUSKY=0 git commit -m "x"', real_repo, True),
        ('git -c core.hooksPath=/dev/null commit -m "x"', real_repo, True),
        ('git -c core.hookspath=/tmp push origin dev', real_repo, True),
        ('git -c user.name=x commit -m "x"', real_repo, False),
        ('HUSKY=1 git commit -m "x"', real_repo, False),
        ("git commit -m x -- --no-verify", real_repo, False),
        # ALLOW: an `n` inside a message or a value is not the flag
        ('git commit -m "no verify needed"', real_repo, False),
        ('git commit -am "nothing"', real_repo, False),
        ("git commit -mnew", real_repo, False),
        ('grep -rn "--no-verify" docs/', real_repo, False),
        # BLOCK: any refspec that lands on main
        ("git push origin main", real_repo, True),
        ("git push origin HEAD:main", real_repo, True),
        ("git push -f origin +main", real_repo, True),
        ("git push origin feature:refs/heads/main", real_repo, True),
        ("git -C . push -u origin main", real_repo, True),
        ("git push --all origin", real_repo, True),
        ("git push --mirror origin", real_repo, True),
        # BLOCK: a bare push, or HEAD, while main is checked out
        ("git push", on_main, True),
        ("git push origin HEAD", on_main, True),
        (f"git -C {on_main} push", real_repo, True),
        # BLOCK: any refspec that lands on dev
        ("git push origin dev", MAIN, True),
        ("git push origin HEAD:dev", tracks_own, True),
        ("git push -f origin +dev", tracks_own, True),
        ("git push origin feat-b:refs/heads/dev", tracks_own, True),
        ("git push origin :dev", tracks_own, True),
        ("git push origin --delete dev", tracks_own, True),
        # BLOCK: a bare push, or HEAD, with dev checked out
        ("git push", real_repo, True),
        ("git push origin HEAD", real_repo, True),
        # BLOCK: a bare push from a branch tracking origin/dev
        ("git push", tracks_dev, True),
        ("git push origin", tracks_dev, True),
        ("git push -f", tracks_dev, True),
        (f"git -C {tracks_dev} push", real_repo, True),
        # ALLOW: naming the destination is the way out of tracking dev
        ("git push -u origin HEAD:refs/heads/feat-a", tracks_dev, False),
        ("git push origin HEAD", tracks_dev, False),
        ("git push", tracks_own, False),
        ("git push", real_worktree, False),
        # ALLOW: other branches, including names that only contain "main" or "dev"
        ("git push origin HEAD", tracks_own, False),
        ("git push origin main-docs", real_repo, False),
        ("git push origin dev-docs", real_repo, False),
        ("git push origin chore/dev-menu", real_repo, False),
        ("git push origin chore/main-menu", real_repo, False),
        ("git push origin --delete feat/x", real_repo, False),
        # BLOCK: new branches that would track origin/dev
        ("git checkout -b x origin/dev", real_repo, True),
        ("git checkout -B x origin/dev", real_repo, True),
        ("git checkout --track origin/dev", real_repo, True),
        ("git checkout -b x refs/remotes/origin/dev", real_repo, True),
        ("git switch -c x origin/dev", real_repo, True),
        ("git switch --create x origin/dev", real_repo, True),
        ("git branch x origin/dev", real_repo, True),
        ("git branch --track x origin/dev", real_repo, True),
        ("git worktree add -b x ../x origin/dev", real_repo, True),
        ("git -C . worktree add ../x -b x origin/dev", real_repo, True),
        # ALLOW: --no-track, other start points, and reading origin/dev
        ("git checkout --no-track -b x origin/dev", real_repo, False),
        ("git checkout -b x --no-track origin/dev", real_repo, False),
        ("git switch --no-track -c x origin/dev", real_repo, False),
        ("git branch --no-track x origin/dev", real_repo, False),
        ("git worktree add --no-track -b x ../x origin/dev", real_repo, False),
        ("git worktree add ../x origin/dev", real_repo, False),
        ("git checkout -b x origin/main", real_repo, False),
        ("git checkout -b x origin/dev~1", real_repo, False),
        ("git checkout -b x", real_repo, False),
        ("git checkout origin/dev", real_repo, False),
        ("git checkout origin/dev -- frontend/package.json", real_repo, False),
        ("git branch --contains origin/dev", real_repo, False),
        ("git branch --merged origin/dev", real_repo, False),
        ("git branch -f x origin/dev", real_repo, False),
        ("git log origin/dev..HEAD", real_repo, False),
        ("git diff origin/dev", real_repo, False),
        # BLOCK: a commit that would silently run no hooks
        ('git commit -m "x"', no_hooks, True),
        # ALLOW: hooks in place, or nothing configured, or not a commit
        ('git commit -m "x"', with_hooks, False),
        ('git commit -m "x"', real_repo, False),
        ("git status", no_hooks, False),
        # BLOCK: a -f pattern that matches the shell running it
        ("pkill -f next-server", real_repo, True),
        ("pkill -9 -f next-server", real_repo, True),
        ("pgrep -f vitest", real_repo, True),
        ("pgrep -af vitest", real_repo, True),
        ("pgrep --full vitest", real_repo, True),
        ("pgrep -f -- vitest", real_repo, True),
        ("sudo pkill -f next", real_repo, True),
        ("sudo -u root pkill -f next", real_repo, True),
        ("bash -c 'pkill -f next'", real_repo, True),
        ("echo $(pgrep -f vitest)", real_repo, True),
        ("pgrep -f 'next.*build'", real_repo, True),
        ("pgrep -f '[v]itest'; echo vitest", real_repo, True),
        ("pkill -f $TARGET", real_repo, True),
        # ALLOW: the bracket trick, no -f, and the words only as data
        ("pgrep -f '[v]itest'", real_repo, False),
        ("pkill -f '[n]ext-server'", real_repo, False),
        ("pgrep -af '[n]ext-build|[v]itest|[s]urefire'", real_repo, False),
        ("while pgrep -f '[s]urefire' >/dev/null; do wait; done", real_repo, False),
        ("pgrep node", real_repo, False),
        ("pkill -x node", real_repo, False),
        ("pkill -TERM node", real_repo, False),
        ("pgrep -u jj node", real_repo, False),
        ("kill 1234", real_repo, False),
        ('grep -rn "pkill -f next" docs/', real_repo, False),
        ('git commit -m "stop using pkill -f next"', real_repo, False),
    ]


def main():
    if not shutil.which("git"):
        print("git is required to run these tests")
        return 1

    root = tempfile.mkdtemp(prefix="guard-commands-")
    try:
        fixture = build_real_worktree(root)
        real_repo, real_worktree, on_main, tracks_dev, tracks_own, no_hooks, with_hooks = fixture
        fails = 0

        for command, cwd, expect_block in cases(*fixture):
            payload = json.dumps(
                {"tool_name": "Bash", "tool_input": {"command": command}, "cwd": cwd}
            )
            result = subprocess.run(
                [sys.executable, HOOK], input=payload, capture_output=True, text=True
            )
            blocked = result.returncode == 2
            ok = blocked == expect_block
            fails += 0 if ok else 1
            where = {MAIN: "main", WT: "wt-path", real_worktree: "wt-git", on_main: "on-main", tracks_dev: "trk-dev", tracks_own: "trk-own"}.get(
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
