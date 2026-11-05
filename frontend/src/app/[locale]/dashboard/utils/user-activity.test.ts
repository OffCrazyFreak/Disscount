import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { countActiveUsers } from "@/app/[locale]/dashboard/utils/user-activity";
import { UserDto } from "@/lib/api/schemas/auth-user";

const NOW = new Date("2026-06-15T12:00:00Z");
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function userLastActive(offsetFromNow: number | null): UserDto {
  return {
    id: crypto.randomUUID(),
    username: null,
    acquisitionChannel: null,
    image: null,
    email: null,
    accountType: "CONSUMER",
    notificationsPushEnabledAt: null,
    notificationsEmailEnabledAt: null,
    newsletterEnabledAt: null,
    feedbackContactEnabledAt: null,
    onboardingCompletedAt: null,
    onboardingOutcome: null,
    createdAt: "2026-01-01T00:00:00Z",
    lastLoginAt: null,
    lastActiveAt:
      offsetFromNow === null
        ? null
        : new Date(NOW.getTime() + offsetFromNow).toISOString(),
  };
}

describe("countActiveUsers", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("counts a user seen inside the window", () => {
    expect(countActiveUsers([userLastActive(-3 * DAY)], "7")).toBe(1);
  });

  it("skips a user last seen before the cutoff", () => {
    expect(countActiveUsers([userLastActive(-8 * DAY)], "7")).toBe(0);
  });

  it("skips a user whose activity is more than an hour in the future", () => {
    expect(countActiveUsers([userLastActive(3 * DAY)], "7")).toBe(0);
    expect(countActiveUsers([userLastActive(HOUR + 1)], "30")).toBe(0);
  });

  it("tolerates up to an hour of clock skew", () => {
    expect(countActiveUsers([userLastActive(HOUR)], "7")).toBe(1);
  });

  it("skips a user with no recorded activity", () => {
    expect(countActiveUsers([userLastActive(null)], "7")).toBe(0);
  });
});
