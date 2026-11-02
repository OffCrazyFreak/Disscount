import { createHash, createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const SECRET = "test-secret-that-is-at-least-32-characters";
vi.stubEnv("BETTER_AUTH_SECRET", SECRET);

const { hashRecipient } = await import("@/lib/email/recipient-hash");

describe("hashRecipient", () => {
  it("cannot be reproduced from the address alone", () => {
    const plainHash = createHash("sha256")
      .update("person@example.com")
      .digest("hex");

    expect(hashRecipient("person@example.com")).not.toBe(plainHash);
    expect(hashRecipient("person@example.com")).toBe(
      createHmac(
        "sha256",
        createHmac("sha256", SECRET).update("email-send-log").digest(),
      )
        .update("person@example.com")
        .digest("hex"),
    );
  });

  it("gives every spelling of one inbox the same hash", () => {
    expect(hashRecipient("Person+deals@Example.com")).toBe(
      hashRecipient("person@example.com"),
    );
  });
});
