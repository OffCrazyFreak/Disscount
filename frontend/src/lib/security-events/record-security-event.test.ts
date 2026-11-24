import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.stubEnv("BETTER_AUTH_SECRET", "test-secret-that-is-at-least-32-characters");

const { values } = vi.hoisted(() => ({ values: vi.fn() }));

vi.mock("@/db", () => ({
  db: { insert: () => ({ values }) },
}));

const { recordSecurityEvent } =
  await import("@/lib/security-events/record-security-event");

const CLOUDFLARE_EDGE = "172.70.1.2";
const VISITOR = "93.140.10.20";
const TYPED_EMAIL = "Ana.Horvat@Example.com";

function cloudflareRequest(extra: Record<string, string> = {}) {
  return new Headers({
    "x-forwarded-for": `${VISITOR}, ${CLOUDFLARE_EDGE}`,
    "cf-connecting-ip": VISITOR,
    "cf-ipcountry": "HR",
    ...extra,
  });
}

function storedRow() {
  return values.mock.calls[0][0] as Record<string, unknown>;
}

describe("recordSecurityEvent", () => {
  it("stores the trusted address, country and outcome with the payload", async () => {
    await recordSecurityEvent("authn_login_success", {
      userId: "user-1",
      headers: cloudflareRequest({ "user-agent": "Firefox" }),
      payload: { method: "password" },
    });

    expect(storedRow()).toEqual({
      eventType: "authn_login_success",
      outcome: "success",
      userId: "user-1",
      subjectHash: null,
      ipAddress: VISITOR,
      userAgent: "Firefox",
      country: "HR",
      payload: { method: "password" },
    });
  });

  it("keeps a keyed hash of a typed email and never the email", async () => {
    await recordSecurityEvent("authn_login_fail", {
      headers: cloudflareRequest(),
      typedEmail: TYPED_EMAIL,
      payload: { reason: "bad_credentials" },
    });

    const row = storedRow();

    expect(row.outcome).toBe("failure");
    expect(row.subjectHash).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(row).toLowerCase()).not.toContain("ana.horvat");
  });

  it("hashes the same address the same way whatever its case and spaces", async () => {
    await recordSecurityEvent("authn_login_fail", {
      typedEmail: TYPED_EMAIL,
      payload: { reason: "other" },
    });
    await recordSecurityEvent("authn_login_fail", {
      typedEmail: ` ${TYPED_EMAIL.toLowerCase()} `,
      payload: { reason: "other" },
    });

    const [first, second] = values.mock.calls.map(
      ([row]) => (row as { subjectHash: string }).subjectHash,
    );
    expect(first).toBe(second);
  });

  it("ignores a forged address and country from a caller that bypassed Cloudflare", async () => {
    await recordSecurityEvent("session_logout", {
      userId: "user-1",
      headers: new Headers({
        "x-forwarded-for": "198.51.100.7",
        "cf-connecting-ip": "1.2.3.4",
        "cf-ipcountry": "US",
      }),
    });

    expect(storedRow()).toMatchObject({
      ipAddress: "198.51.100.7",
      country: null,
    });
  });

  it("cuts a long user agent to the column's 256 characters", async () => {
    await recordSecurityEvent("session_logout", {
      headers: new Headers({ "user-agent": "x".repeat(1000) }),
    });

    expect(storedRow().userAgent).toHaveLength(256);
  });

  it("logs instead of failing the action it records", async () => {
    values.mockRejectedValueOnce(new Error("permission denied"));
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    await expect(
      recordSecurityEvent("authn_password_change", { userId: "user-1" }),
    ).resolves.toBeUndefined();
    expect(consoleError).toHaveBeenCalledWith(
      "Failed to record security event authn_password_change:",
      "Error",
    );
  });
});
