import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const transaction = vi.hoisted(() => vi.fn());

vi.mock("@/db", () => ({ db: { transaction } }));

const { claimVerificationEmail } =
  await import("@/lib/auth/verification-email-marker");

function token(claims: object) {
  return `header.${Buffer.from(JSON.stringify(claims)).toString("base64url")}.signature`;
}

describe("claimVerificationEmail", () => {
  it("always lets a change-email link through", async () => {
    const release = await claimVerificationEmail(
      "user-1",
      "new@example.com",
      token({ email: "old@example.com", updateTo: "new@example.com", exp: 0 }),
    );

    expect(release).toBeTypeOf("function");
    expect(transaction).not.toHaveBeenCalled();
  });
});
