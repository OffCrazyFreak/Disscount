import { QueryClient } from "@tanstack/react-query";
import { http, HttpResponse } from "msw/http";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";

import { userProfileQueryOptions } from "@/lib/api/users/profile-query";
import { USER_QUERY_KEYS } from "@/lib/api/users/keys";
import type { UserDto } from "@/lib/api/types";
import { setCacheIdentity } from "@/lib/offline/cache-identity";
import { server } from "@/test/msw-server";
import { storedUser } from "@/test/stored-user";

const SAVED: UserDto = {
  ...storedUser,
  id: "user-a",
  username: "saved ana",
  pinnedStores: [],
  pinnedPlaces: [],
};

const { accountType: _omitted, ...driftedProfile } = storedUser;

function answerProfile(answer: () => Response) {
  server.use(http.get("*/api/users/me", answer));
}

function clientWithSavedProfile(saved: UserDto | null) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  if (saved) queryClient.setQueryData(USER_QUERY_KEYS.me, saved);
  return queryClient;
}

function refetchProfile(queryClient: QueryClient) {
  return queryClient.fetchQuery(userProfileQueryOptions("user-a"));
}

beforeEach(() => {
  setCacheIdentity("user-a");
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("userProfileQueryOptions with a saved profile", () => {
  it("keeps the saved profile when the server answers with an error", async () => {
    answerProfile(() => HttpResponse.json({}, { status: 503 }));
    const queryClient = clientWithSavedProfile(SAVED);

    await expect(refetchProfile(queryClient)).resolves.toEqual(SAVED);
    expect(queryClient.getQueryState(USER_QUERY_KEYS.me)?.status).toBe(
      "success",
    );
  });

  it("keeps the saved profile when no answer comes back", async () => {
    answerProfile(() => HttpResponse.error());
    const queryClient = clientWithSavedProfile(SAVED);

    await expect(refetchProfile(queryClient)).resolves.toEqual(SAVED);
  });

  it("keeps the saved profile when another tab moved the session to another account", async () => {
    answerProfile(() =>
      HttpResponse.json({ code: "session_changed" }, { status: 401 }),
    );
    const queryClient = clientWithSavedProfile(SAVED);

    await expect(refetchProfile(queryClient)).resolves.toEqual(SAVED);
  });

  it("keeps the saved profile while the server throttles", async () => {
    answerProfile(() => HttpResponse.json({}, { status: 429 }));
    const queryClient = clientWithSavedProfile(SAVED);

    await expect(refetchProfile(queryClient)).resolves.toEqual(SAVED);
  });

  it("fails when the server refuses the request", async () => {
    answerProfile(() => HttpResponse.json({}, { status: 401 }));
    const queryClient = clientWithSavedProfile(SAVED);

    await expect(refetchProfile(queryClient)).rejects.toMatchObject({
      response: { status: 401 },
    });
  });

  it("fails when the answer does not match the schema", async () => {
    answerProfile(() => HttpResponse.json(driftedProfile));
    const queryClient = clientWithSavedProfile(SAVED);

    await expect(refetchProfile(queryClient)).rejects.toBeInstanceOf(ZodError);
  });

  it("fails rather than serve a saved profile of another account", async () => {
    setCacheIdentity("user-b");
    answerProfile(() => HttpResponse.json({}, { status: 503 }));
    const queryClient = clientWithSavedProfile(SAVED);

    await expect(refetchProfile(queryClient)).rejects.toMatchObject({
      response: { status: 503 },
    });
  });
});

describe("userProfileQueryOptions without a saved profile", () => {
  it("fails on a server error", async () => {
    answerProfile(() => HttpResponse.json({}, { status: 503 }));
    const queryClient = clientWithSavedProfile(null);

    await expect(refetchProfile(queryClient)).rejects.toMatchObject({
      response: { status: 503 },
    });
  });

  it("loads the pinned stores and places the profile left out", async () => {
    const { pinnedStores: _s, pinnedPlaces: _p, ...bare } = SAVED;
    const pinned = [
      { id: "pin-1", userId: "user-a", storeApiId: "konzum:1", storeName: "K" },
    ];
    answerProfile(() => HttpResponse.json(bare));
    server.use(
      http.get("*/api/pinned-stores/me", () => HttpResponse.json(pinned)),
      http.get("*/api/pinned-places/me", () => HttpResponse.json([])),
    );

    await expect(
      refetchProfile(clientWithSavedProfile(null)),
    ).resolves.toMatchObject({ pinnedStores: pinned, pinnedPlaces: [] });
  });
});
