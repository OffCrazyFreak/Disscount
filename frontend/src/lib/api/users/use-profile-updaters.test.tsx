import { QueryClient } from "@tanstack/react-query";
import { act } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import type { UserDto } from "@/lib/api/types";
import { USER_QUERY_KEYS } from "@/lib/api/users/keys";
import { useProfileUpdaters } from "@/lib/api/users/use-profile-updaters";
import { setCacheIdentity } from "@/lib/offline/cache/cache-identity";
import { renderHookWithProviders } from "@/test/render";
import { storedUser } from "@/test/fixtures/stored-user";

const PROFILE_OF_A = { ...storedUser, id: "user-a" } as UserDto;

/** A profile load for the new account that never answers, so only a cancel can end it. */
function startNewAccountLoad(queryClient: QueryClient) {
  void queryClient
    .fetchQuery({
      queryKey: USER_QUERY_KEYS.me,
      queryFn: () => new Promise<UserDto>(() => {}),
    })
    .catch(() => {});
}

beforeEach(() => setCacheIdentity("user-b"));

describe("useProfileUpdaters", () => {
  it("leaves the new account's profile load running when a late save of the previous account does not apply", async () => {
    const queryClient = new QueryClient();
    startNewAccountLoad(queryClient);
    const { result } = renderHookWithProviders(() => useProfileUpdaters(), {
      queryClient,
    });

    await act(async () => result.current.mergeUser(PROFILE_OF_A));

    expect(queryClient.getQueryState(USER_QUERY_KEYS.me)?.fetchStatus).toBe(
      "fetching",
    );
  });

  it("leaves the load running when there is no profile to edit", async () => {
    const queryClient = new QueryClient();
    startNewAccountLoad(queryClient);
    const { result } = renderHookWithProviders(() => useProfileUpdaters(), {
      queryClient,
    });

    await act(async () => result.current.updatePinnedStores([]));

    expect(queryClient.getQueryState(USER_QUERY_KEYS.me)?.fetchStatus).toBe(
      "fetching",
    );
  });
});

describe("useProfileUpdaters with the new account's profile loaded", () => {
  const PROFILE_OF_B = {
    ...storedUser,
    id: "user-b",
    onboardingOutcome: "completed",
    pinnedStores: [],
  } as UserDto;

  function renderWithProfileOfB() {
    const queryClient = new QueryClient();
    queryClient.setQueryData(USER_QUERY_KEYS.me, PROFILE_OF_B);
    const { result } = renderHookWithProviders(() => useProfileUpdaters(), {
      queryClient,
    });
    return { queryClient, result };
  }

  it("drops pinned stores saved by the previous account", async () => {
    const { queryClient, result } = renderWithProfileOfB();
    const pinsOfA = [
      { id: "pin-a", userId: "user-a", storeApiId: "konzum:1", storeName: "K" },
    ];

    await act(async () => result.current.updatePinnedStores(pinsOfA, "user-a"));

    expect(queryClient.getQueryData(USER_QUERY_KEYS.me)).toEqual(PROFILE_OF_B);
  });

  it("drops pinned places saved by the previous account", async () => {
    const { queryClient, result } = renderWithProfileOfB();

    await act(async () => result.current.updatePinnedPlaces([], "user-a"));

    expect(queryClient.getQueryData(USER_QUERY_KEYS.me)).toEqual(PROFILE_OF_B);
  });

  it("keeps a finished onboarding when an earlier skip answers late", async () => {
    const { queryClient, result } = renderWithProfileOfB();

    await act(async () =>
      result.current.mergeUser({
        id: "user-b",
        onboardingOutcome: "skipped:2",
      }),
    );

    expect(queryClient.getQueryData(USER_QUERY_KEYS.me)).toEqual(PROFILE_OF_B);
  });
});
