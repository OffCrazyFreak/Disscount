import "server-only";

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

// In memory because the app runs as one container; a restart only resets the count.
const attempts = new Map<string, { count: number; resetAt: number }>();

// auth.api calls skip better-auth's HTTP rate limiter, so a stolen session could
// otherwise guess the current password through our own routes without limit. The slot is
// taken before the check, so parallel guesses count too; a correct password clears it.
export function reservePasswordAttempt(userId: string): boolean {
  const now = Date.now();
  const entry = attempts.get(userId);

  if (!entry || entry.resetAt <= now) {
    attempts.set(userId, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (entry.count >= MAX_ATTEMPTS) return false;

  entry.count += 1;
  return true;
}

export function clearPasswordAttempts(userId: string) {
  attempts.delete(userId);
}
