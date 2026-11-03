import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { betterAuth } from "better-auth";
import { memoryAdapter } from "better-auth/adapters/memory";

type Row = Record<string, unknown>;

const LONG_RULE_PATH = "/ok";
const FIFTEEN_MINUTES = 15 * 60;
const MAX_TRIES = 5;

function buildAuth() {
  const tables: Record<string, Row[]> = {
    user: [],
    session: [],
    account: [],
    verification: [],
    rateLimit: [],
  };

  return betterAuth({
    baseURL: "http://localhost:3000",
    secret: "test-secret-that-is-at-least-32-characters",
    database: memoryAdapter(tables),
    advanced: { ipAddress: { ipAddressHeaders: ["x-forwarded-for"] } },
    rateLimit: {
      enabled: true,
      storage: "database",
      customRules: {
        [LONG_RULE_PATH]: { window: FIFTEEN_MINUTES, max: MAX_TRIES },
      },
    },
  });
}

function call(
  auth: ReturnType<typeof buildAuth>,
  path: string,
  address: string,
) {
  return auth.handler(
    new Request(`http://localhost:3000/api/auth${path}`, {
      headers: { "x-forwarded-for": address },
    }),
  );
}

// Regression for #445: better-auth 1.6 pruned stored counters older than 60 seconds,
// whatever a custom rule's window, so a 15 minute lockout reset after a minute.
describe("rate limit counters with a window longer than a minute", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("keep a locked out address locked after an unrelated sweep", async () => {
    const auth = buildAuth();
    const attacker = "203.0.113.1";
    const bystander = "203.0.113.2";

    for (let attempt = 0; attempt < MAX_TRIES; attempt++) {
      expect((await call(auth, LONG_RULE_PATH, attacker)).status).toBe(200);
    }
    expect((await call(auth, LONG_RULE_PATH, attacker)).status).toBe(429);

    // A second address hitting a 10 second path again once its row is stale takes the
    // reset branch, which is what runs the table-wide sweep.
    await vi.advanceTimersByTimeAsync(61_000);
    await call(auth, "/get-session", bystander);
    await vi.advanceTimersByTimeAsync(11_000);
    await call(auth, "/get-session", bystander);
    await vi.runAllTimersAsync();

    expect((await call(auth, LONG_RULE_PATH, attacker)).status).toBe(429);
  });
});
