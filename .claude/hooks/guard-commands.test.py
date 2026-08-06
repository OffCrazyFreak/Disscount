import json, subprocess, sys

HOOK = "/home/silver/Desktop/Disscount/.claude/hooks/guard-commands.py"
MAIN = "/home/silver/Desktop/Disscount"
WT = "/home/silver/Desktop/Disscount/.claude/worktrees/foo"

# (command, cwd, should_block)
cases = [
    # must BLOCK: dev servers, including the spellings prefix matching misses
    ("pnpm dev", MAIN, True),
    ("pnpm run dev", MAIN, True),
    ("pnpm --filter frontend dev", MAIN, True),
    ("cd frontend && pnpm dev", MAIN, True),
    ("mvn spring-boot:run", MAIN, True),
    ("mvn -B spring-boot:run", MAIN, True),
    ("mvn -f backend/pom.xml spring-boot:run", MAIN, True),
    ("./mvnw -B spring-boot:run", MAIN, True),
    ("next dev", MAIN, True),
    ("pnpm email", MAIN, True),
    ("CI=true pnpm dev", MAIN, True),
    ("sudo pnpm dev", MAIN, True),
    ("timeout 30 pnpm dev", MAIN, True),
    # must BLOCK: pnpm inside a worktree
    ("pnpm lint", WT, True),
    ("pnpm exec tsc --noEmit", WT, True),
    ("pnpm install", WT, True),
    # must ALLOW: the checks we actually run
    ("pnpm lint", MAIN, False),
    ("pnpm exec tsc --noEmit", MAIN, False),
    ("pnpm build", MAIN, False),
    ("mvn -B verify", MAIN, False),
    ("mvn -B -DskipTests package", MAIN, False),
    ("./node_modules/.bin/tsc --noEmit", WT, False),
    ("./node_modules/.bin/eslint src", WT, False),
    ("pnpm exec next lint", MAIN, False),
    ("./node_modules/.bin/next lint --fix", MAIN, False),
    # must ALLOW: the word appears but nothing is executed
    ('grep -rn "pnpm dev" docs/', MAIN, False),
    ('echo "run pnpm dev yourself"', MAIN, False),
    ("git push origin dev", MAIN, False),
    ("git checkout dev", MAIN, False),
    ("git log --oneline dev", MAIN, False),
    ("gh pr create --base dev", MAIN, False),
    ("pnpm --filter dev-tools lint", MAIN, False),
]

fails = 0
for cmd, cwd, expect_block in cases:
    payload = json.dumps({"tool_name": "Bash", "tool_input": {"command": cmd}, "cwd": cwd})
    r = subprocess.run([HOOK], input=payload, capture_output=True, text=True)
    blocked = r.returncode == 2
    ok = blocked == expect_block
    if not ok:
        fails += 1
    tag = "ok  " if ok else "FAIL"
    where = "worktree" if cwd == WT else "main"
    print(f"{tag} [{where:8}] block={str(blocked):5} want={str(expect_block):5}  {cmd}")

print()
print("FAILURES:", fails)
sys.exit(1 if fails else 0)
