import "server-only";

const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000;

// In memory because the app runs as one container; a restart only resets the count.
const failures = new Map<string, { count: number; resetAt: number }>();

// auth.api calls skip better-auth's HTTP rate limiter, so a stolen session could
// otherwise guess the current password through our own routes without limit.
export function isPasswordAttemptBlocked(userId: string): boolean {
  const entry = failures.get(userId);
  if (!entry) return false;

  if (entry.resetAt <= Date.now()) {
    failures.delete(userId);
    return false;
  }

  return entry.count >= MAX_FAILURES;
}

export function recordPasswordFailure(userId: string) {
  const now = Date.now();
  const entry = failures.get(userId);

  if (!entry || entry.resetAt <= now) {
    failures.set(userId, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    entry.count += 1;
  }
}

export function clearPasswordFailures(userId: string) {
  failures.delete(userId);
}
