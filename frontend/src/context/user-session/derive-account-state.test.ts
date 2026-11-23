import { describe, expect, it } from "vitest";

import { deriveAccountState } from "@/context/user-session/derive-account-state";
import type { UserDto } from "@/lib/api/types";
import { storedUser } from "@/test/fixtures/stored-user";

function offlineWith(profileId: string, cacheIdentity: string) {
  return deriveAccountState({
    session: null,
    sessionPending: false,
    sessionError: new Error("offline"),
    sessionAccount: null,
    cacheIdentity,
    accountId: null,
    profile: { ...storedUser, id: profileId } as UserDto,
    hasProfileFailed: false,
    profileFetchStatus: "idle",
  });
}

describe("deriveAccountState offline", () => {
  it("shows the saved profile of the account the device belongs to", () => {
    expect(offlineWith("user-b", "user-b").accountUser?.id).toBe("user-b");
  });

  it("never shows a saved profile of another account", () => {
    const state = offlineWith("user-a", "user-b");

    expect(state.hasUnverifiedAccount).toBe(true);
    expect(state.accountUser).toBeNull();
  });
});
