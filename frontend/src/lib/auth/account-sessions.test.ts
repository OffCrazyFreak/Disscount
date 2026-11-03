import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const fake = vi.hoisted(() => ({
  rows: [] as Record<string, unknown>[],
  deleted: [] as { id: string }[],
}));

vi.mock("@/db", () => ({
  db: {
    select: () => ({
      from: () => ({ where: () => ({ orderBy: async () => fake.rows }) }),
    }),
    delete: () => ({ where: () => ({ returning: async () => fake.deleted }) }),
  },
}));

const { listAccountSessions, revokeAccountSession } =
  await import("@/lib/auth/account-sessions");

const IPHONE_SAFARI =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const WINDOWS_CHROME =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

describe("listAccountSessions", () => {
  it("puts this device first and names browser, system and kind", async () => {
    const day = new Date("2026-11-01T10:00:00Z");
    fake.rows = [
      {
        id: "other",
        userAgent: IPHONE_SAFARI,
        country: "HR",
        createdAt: day,
        updatedAt: day,
      },
      {
        id: "current",
        userAgent: WINDOWS_CHROME,
        country: null,
        createdAt: day,
        updatedAt: day,
      },
    ];

    const sessions = await listAccountSessions("user-1", "current");

    expect(sessions).toEqual([
      {
        id: "current",
        isCurrent: true,
        browser: "Chrome",
        os: "Windows",
        deviceType: "desktop",
        country: null,
        lastActiveAt: day.toISOString(),
      },
      {
        id: "other",
        isCurrent: false,
        browser: "Safari",
        os: "iOS",
        deviceType: "mobile",
        country: "HR",
        lastActiveAt: day.toISOString(),
      },
    ]);
  });

  it("names nothing for a session without a user agent", async () => {
    const day = new Date();
    fake.rows = [
      { id: "s", userAgent: null, country: null, createdAt: day, updatedAt: day },
    ];

    const [session] = await listAccountSessions("user-1", "other");

    expect(session).toMatchObject({ browser: null, os: null, deviceType: null });
  });
});

describe("revokeAccountSession", () => {
  it("reports a session that was not the user's as not revoked", async () => {
    fake.deleted = [];

    expect(await revokeAccountSession("user-1", "someone-else")).toBe(false);
  });
});
