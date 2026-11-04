import { describe, expect, it } from "vitest";

import { userDtoSchema, userRequestSchema } from "@/lib/api/schemas/auth-user";
import { storedUser } from "@/test/stored-user";

describe("userDtoSchema", () => {
  it("accepts a username shorter than the form allows, which the column stores", () => {
    const parsed = userDtoSchema.parse({ ...storedUser, username: "a" });

    expect(parsed.username).toBe("a");
  });

  it("accepts an email the backend stored without a format check", () => {
    const parsed = userDtoSchema.parse({
      ...storedUser,
      email: "ana@localhost",
    });

    expect(parsed.email).toBe("ana@localhost");
  });

  it("rejects a response that drops a key the backend always sends", () => {
    const { lastLoginAt: _omitted, ...withoutKey } = storedUser;

    expect(userDtoSchema.safeParse(withoutKey).success).toBe(false);
  });
});

describe("userRequestSchema onboardingOutcome", () => {
  it.each(["completed", "skipped:0", "skipped:4", "skipped:999"])(
    "accepts %s",
    (onboardingOutcome) => {
      expect(userRequestSchema.safeParse({ onboardingOutcome }).success).toBe(
        true,
      );
    },
  );

  it.each(["skipped:1000", "skipped:", "skipped:x", "pending"])(
    "rejects %s, which the backend answers with a 400",
    (onboardingOutcome) => {
      expect(userRequestSchema.safeParse({ onboardingOutcome }).success).toBe(
        false,
      );
    },
  );
});
