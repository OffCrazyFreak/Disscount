import { describe, expect, it } from "vitest";

import { settingsFormSchema } from "@/components/custom/settings/settings-schema";

const BASE_VALUES = {
  username: "ana",
  notificationsPush: false,
  notificationsEmail: false,
  newsletter: false,
  feedbackContact: false,
  pinnedStores: [],
  pinnedPlaces: [],
};

function codes(count: number) {
  return Array.from({ length: count }, (_, index) => `code-${index}`);
}

function issueMessages(values: object) {
  const result = settingsFormSchema.safeParse({ ...BASE_VALUES, ...values });

  return result.success
    ? []
    : result.error.issues.map((issue) => issue.message);
}

describe("settingsFormSchema pins", () => {
  it("accepts 50 pinned stores and 50 pinned places", () => {
    expect(
      issueMessages({ pinnedStores: codes(50), pinnedPlaces: codes(50) }),
    ).toEqual([]);
  });

  it("rejects a 51st pinned store or place, matching the backend limit", () => {
    expect(
      issueMessages({ pinnedStores: codes(51), pinnedPlaces: codes(51) }),
    ).toEqual([
      "settings.validation.pinnedStoresMax",
      "settings.validation.pinnedPlacesMax",
    ]);
  });
});
