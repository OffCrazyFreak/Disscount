import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { set, where } = vi.hoisted(() => ({ set: vi.fn(), where: vi.fn() }));

vi.mock("@/db", () => ({
  db: { update: () => ({ set: set.mockReturnValue({ where }) }) },
}));

const { recordLastLogin } = await import("@/lib/auth/record-last-login");

const session = {
  userId: "7d0c2f3e-1a2b-4c5d-8e9f-0a1b2c3d4e5f",
  createdAt: new Date("2026-10-31T08:15:00Z"),
};

describe("recordLastLogin", () => {
  it("stamps the session's creation time on that user", async () => {
    await recordLastLogin(session);

    expect(set).toHaveBeenCalledWith({ lastLoginAt: session.createdAt });

    const condition = new PgDialect().sqlToQuery(where.mock.calls[0][0] as SQL);
    expect(condition.sql).toBe('"auth"."user"."id" = $1');
    expect(condition.params).toEqual([session.userId]);
  });

  it("logs instead of failing a sign-in that already succeeded", async () => {
    where.mockRejectedValueOnce(new Error("connection refused"));
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    await expect(recordLastLogin(session)).resolves.toBeUndefined();
    expect(consoleError).toHaveBeenCalledWith(
      "Failed to record last login:",
      "Error",
    );
  });
});
