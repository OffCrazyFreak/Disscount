import { QueryClient } from "@tanstack/react-query";
import { waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { useAccountUser } from "@/context/use-account-user";
import { USER_QUERY_KEYS } from "@/lib/api/users/keys";
import type { UserDto } from "@/lib/api/types";
import { setCacheIdentity } from "@/lib/offline/cache-identity";
import { trackPurge } from "@/lib/offline/purge-gate";
import { renderHookWithProviders } from "@/test/render";

const PROFILE = {
  id: "user-b",
  username: "bruno",
  pinnedStores: [],
  pinnedPlaces: [],
} as Partial<UserDto> as UserDto;

// Stands in for purgeOfflineCache: it resets the user queries once its awaits settle.
function startPurge(queryClient: QueryClient) {
  let finish = () => {};
  const purge = new Promise<void>((resolve) => {
    finish = resolve;
  }).then(() => queryClient.resetQueries({ queryKey: USER_QUERY_KEYS.me }));

  trackPurge(purge);
  return { finish, purge };
}

describe("useAccountUser", () => {
  beforeEach(() => setCacheIdentity(PROFILE.id));

  it("saves a profile loaded during a purge only after the purge finishes", async () => {
    const queryClient = new QueryClient();
    const { finish, purge } = startPurge(queryClient);

    renderHookWithProviders(() => useAccountUser(PROFILE, false), {
      queryClient,
    });
    finish();
    await purge;

    await waitFor(() =>
      expect(queryClient.getQueryData(USER_QUERY_KEYS.me)).toEqual(PROFILE),
    );
  });

  it("does not save a profile once a later purge has cleared the account", async () => {
    const queryClient = new QueryClient();
    const first = startPurge(queryClient);

    renderHookWithProviders(() => useAccountUser(PROFILE, false), {
      queryClient,
    });
    const second = startPurge(queryClient);
    first.finish();
    second.finish();
    await Promise.all([first.purge, second.purge]);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(queryClient.getQueryData(USER_QUERY_KEYS.me)).toBeUndefined();
  });

  it("does not save the previous account's profile once the device moved to another", async () => {
    setCacheIdentity("user-c");
    const queryClient = new QueryClient();

    renderHookWithProviders(() => useAccountUser(PROFILE, false), {
      queryClient,
    });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(queryClient.getQueryData(USER_QUERY_KEYS.me)).toBeUndefined();
  });
});
