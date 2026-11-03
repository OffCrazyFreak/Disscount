import { describe, expect, it } from "vitest";

import { userDtoSchema } from "@/lib/api/schemas/auth-user";

// The shape UserDto serializes: Jackson sends every key, unset ones as null.
const storedUser = {
  id: "5a1d7c3e-2b4f-4e8a-a1c9-3f6e2d7b8c90",
  username: "ana",
  email: null,
  notificationsPushEnabledAt: null,
  notificationsEmailEnabledAt: null,
  newsletterEnabledAt: null,
  feedbackContactEnabledAt: null,
  acquisitionChannel: null,
  image: null,
  onboardingCompletedAt: "2026-11-03T09:15:00",
  onboardingOutcome: "completed",
  accountType: "CONSUMER",
  createdAt: "2026-11-03T09:00:00",
  lastLoginAt: null,
  lastActiveAt: "2026-11-03T09:15:00Z",
};

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
