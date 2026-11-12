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
# The main checkout even when this runs from a linked worktree.
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
    os.makedirs(os.path.join(linked, "frontend"))
    os.symlink(os.path.join(repo, "frontend", "node_modules"), os.path.join(linked, "frontend", "node_modules"))
    installed = os.path.join(root, "installed")
    run("git", "worktree", "add", "-q", "-b", "wt-installed", installed)
    os.makedirs(os.path.join(installed, "frontend", "node_modules"))
    fresh = os.path.join(root, "fresh")
    run("git", "worktree", "add", "-q", "-b", "wt-fresh", fresh)
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

    return repo, linked, on_main, tracks_dev, tracks_own, no_hooks, with_hooks, installed, fresh


def cases(real_repo, real_worktree, on_main, tracks_dev, tracks_own, no_hooks, with_hooks, installed, fresh):
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
        # ALLOW: a worktree with its own install, or none yet, has no link to purge through
        ("pnpm install --frozen-lockfile", installed, False),
        ("pnpm check", installed, False),
        ("sudo -u root pnpm install", installed, False),
        (f"cd {installed}/frontend && pnpm check", MAIN, False),
        ("pnpm install --frozen-lockfile", fresh, False),
        ('bash -c "pnpm install"', fresh, False),
        # BLOCK: a link made earlier in the same command, which the guard runs before
        ("ln -s /main/frontend/node_modules frontend/node_modules && pnpm exec tsc --noEmit", fresh, True),
        # BLOCK: a symlinked install reached from outside, through frontend/
        (f"cd {real_worktree}/frontend && pnpm check", MAIN, True),
        # BLOCK: pnpm where node_modules is linked or git cannot say
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
        # ALLOW: branching from origin/dev, since only a push can reach dev
        ("git checkout -b x origin/dev", real_repo, False),
        ("git switch -c x origin/dev", real_repo, False),
        ("git branch x origin/dev", real_repo, False),
        ("git worktree add -b x ../x origin/dev", real_repo, False),
        # BLOCK: a commit that would silently run no hooks
        ('git commit -m "x"', no_hooks, True),
        # ALLOW: hooks in place, or nothing configured, or not a commit
        ('git commit -m "x"', with_hooks, False),
        ('git commit -m "x"', real_repo, False),
        ("git status", no_hooks, False),
        # BLOCK: a shell keyword or subshell in front of the command used to hide it
        ("while pgrep -f vitest; do wait; done", real_repo, True),
        ("until ! pgrep -f vitest; do wait; done", real_repo, True),
        ("for p in a b; do pkill -f vitest; done", real_repo, True),
        ("if pgrep -f vitest; then echo x; fi", real_repo, True),
        ("! pgrep -f vitest", real_repo, True),
        ("(pkill -f vitest)", real_repo, True),
        ("{ pkill -f vitest; }", real_repo, True),
        ("if git push origin dev; then echo x; fi", real_repo, True),
        ("(git push origin dev)", real_repo, True),
        ("if true; then git commit --no-verify -m x; fi", real_repo, True),
        ("if true; then pnpm install; fi", WT, True),
        # BLOCK: a wrapper's own options used to hide git
        ("sudo -u root git push origin dev", real_repo, True),
        ("env -C /tmp git push origin dev", real_repo, True),
        # BLOCK: a refspec that can name dev or main
        ("git push origin 'refs/heads/*:refs/heads/*'", tracks_own, True),
        ('git push origin "$BRANCH"', tracks_own, True),
        # ALLOW: tags only, even from a branch tracking origin/dev
        ("git push --tags", tracks_dev, False),
        ("git push origin --tags", tracks_dev, False),
        ("git push origin v1.0", tracks_own, False),
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
        # ALLOW: a merge GitHub reports as ready, by every route (the gh stub answers by number)
        ("gh pr merge 101 --squash", real_repo, False),
        ("gh pr merge 104", real_repo, False),
        ("gh pr merge 101 --repo o/r", real_repo, False),
        ("gh pr merge --squash", real_repo, False),
        ("gh api -X PUT repos/o/r/pulls/101/merge -f merge_method=squash", real_repo, False),
        ("gh api --method=PUT /repos/{owner}/{repo}/pulls/101/merge", real_repo, False),
        # BLOCK: a required check that is red, pending or missing, an --admin merge included
        ("gh pr merge 102", real_repo, True),
        ("gh pr merge 102 --admin --squash", real_repo, True),
        ("gh pr merge 102 -t 101", real_repo, True),
        ("gh pr merge 102 -Ro/r", real_repo, True),
        ("gh api -X PUT repos/o/r/pulls/102/merge", real_repo, True),
        ("gh api -XPUT https://api.github.com/repos/o/r/pulls/102/merge", real_repo, True),
        ("gh api repos/o/r/pulls/102/merge -f merge_method=squash", real_repo, True),
        ('bash -c "gh pr merge 102"', real_repo, True),
        ("sudo -u root gh pr merge 102", real_repo, True),
        # BLOCK: no answer from GitHub, or a state that is not ready yet
        ("gh pr merge 103", real_repo, True),
        ("gh pr merge 105", real_repo, True),
        # BLOCK: the target or body cannot be read from here
        ("gh pr merge $N", real_repo, True),
        ("gh pr merge 101 --repo $R", real_repo, True),
        ("gh pr merge $(gh pr list --json number)", real_repo, True),
        ('gh pr merge 101 --body "$(cat notes)"', real_repo, True),
        ("gh pr list | xargs gh pr merge", real_repo, True),
        ("gh api -X PUT repos/o/r/pulls/$N/merge", real_repo, True),
        ("gh api -X PUT repos/$R/pulls/101/merge", real_repo, True),
        ("gh api -X PUT repos/o/r/pulls/$(gh pr view --json number)/merge", real_repo, True),
        ("cd $SOMEWHERE && gh pr merge 101", MAIN, True),
        ("gh api graphql -f query='mutation { mergePullRequest(input: {}) { clientMutationId } }'", real_repo, True),
        ("gh api graphql --input query.json", real_repo, True),
        ("gh api graphql --input=query.json", real_repo, True),
        ('gh api graphql -f query="$(cat q.graphql)"', real_repo, True),
        ('gh api graphql -f query="$Q"', real_repo, True),
        ("gh api graphql -f query=@q.graphql", real_repo, True),
        ("P=pulls/102/merge; gh api -X PUT repos/o/r/$P", real_repo, True),
        ('gh api -X PUT "$URL"', real_repo, True),
        ("gh api -X PUT $(cat url)", real_repo, True),
        ("gh api -X PUT repos/o/r/$(cat path)", real_repo, True),
        # BLOCK: a wrapped process match still reaches its own guard
        ("sudo pkill -f gh", real_repo, True),
        # ALLOW: reading and talking about merges
        ("gh api repos/o/r/pulls/102/merge", real_repo, False),
        ("gh api -X GET repos/o/r/pulls/102/merge", real_repo, False),
        ("gh pr view 102", real_repo, False),
        ('gh api repos/o/r/pulls/5/comments/9/replies -f body="$(cat reply.md)"', real_repo, False),
        ('gh api repos/$R/issues/5/comments -f body="$(cat note.md)"', real_repo, False),
        ('gh api repos/o/r/issues/5/comments -f body="see pulls/102/merge"', real_repo, False),
        ("gh api graphql -f query='query($n: Int!) { viewer { login } }' -F n=1", real_repo, False),
        ("gh pr checks 102 --required", real_repo, False),
        ("gh api graphql -f query='{ viewer { login } }'", real_repo, False),
        ('grep -rn "gh pr merge 102" docs/', real_repo, False),
        ("gh pr comment 102 --body-file - <<'EOF'\ngh pr merge 102\nEOF", real_repo, False),
    ]


GH_STUB = """#!/bin/sh
case "$*" in
  "pr view 101 "*) echo '{"mergeStateStatus":"CLEAN"}' ;;
  "pr view 104 "*) echo '{"mergeStateStatus":"UNSTABLE"}' ;;
  "pr view 105 "*) echo '{"mergeStateStatus":"UNKNOWN"}' ;;
  "pr view 103 "*) exit 1 ;;
  "pr view --json "*) echo '{"mergeStateStatus":"CLEAN"}' ;;
  *) echo '{"mergeStateStatus":"BLOCKED"}' ;;
esac
"""


def install_gh_stub(root):
    """Answer mergeStateStatus offline, so the merge cases never reach GitHub."""
    stub_dir = os.path.join(root, "stub-bin")
    os.makedirs(stub_dir)
    stub = os.path.join(stub_dir, "gh")
    with open(stub, "w") as handle:
        handle.write(GH_STUB)
    os.chmod(stub, 0o755)
    os.environ["PATH"] = stub_dir + os.pathsep + os.environ["PATH"]


def main():
    if not shutil.which("git"):
        print("git is required to run these tests")
        return 1

    root = tempfile.mkdtemp(prefix="guard-commands-")
    try:
        install_gh_stub(root)
        fixture = build_real_worktree(root)
        real_repo, real_worktree, on_main, tracks_dev, tracks_own, no_hooks, with_hooks, installed, fresh = fixture
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
