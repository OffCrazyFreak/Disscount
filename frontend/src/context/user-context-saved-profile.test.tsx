import { tab } from "@/test/user-context-mocks";
import { screen, waitFor } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
import { http, HttpResponse } from "msw/http";
import { describe, expect, it } from "vitest";

import { UserProvider, useUser } from "@/context/user-context";
import { USER_QUERY_KEYS } from "@/lib/api/users/keys";
import type { UserDto } from "@/lib/api/types";
import { shouldPersistQuery } from "@/lib/offline/cached-query-keys";
import { setCacheIdentity } from "@/lib/offline/cache-identity";
import { server } from "@/test/msw-server";
import { renderWithProviders } from "@/test/render";
import { storedUser } from "@/test/stored-user";

const PINNED = [
  {
    id: "pin-1",
    userId: "user-a",
    storeApiId: "konzum:101",
    storeName: "Konzum Ilica",
  },
];
const PROFILE: UserDto = {
  ...storedUser,
  id: "user-a",
  username: "ana",
  pinnedStores: PINNED,
  pinnedPlaces: [],
};

function PinnedProbe() {
  const { accountUser } = useUser();
  return (
    <p>{accountUser?.pinnedStores?.[0]?.storeName ?? "no pinned stores"}</p>
  );
}

describe("UserProvider saved profile", () => {
  it("keeps the loaded profile, pinned stores included, in the offline snapshot", async () => {
    setCacheIdentity("user-a");
    tab.userId = "user-a";
    server.use(http.get("*/api/users/me", () => HttpResponse.json(PROFILE)));
    const queryClient = new QueryClient();

    renderWithProviders(
      <UserProvider>
        <PinnedProbe />
      </UserProvider>,
      { queryClient },
    );

    await waitFor(() =>
      expect(queryClient.getQueryData(USER_QUERY_KEYS.me)).toMatchObject({
        pinnedStores: PINNED,
      }),
    );
    expect(shouldPersistQuery(USER_QUERY_KEYS.me)).toBe(true);
  });

  it("offline, gives the unverified account its saved pinned stores", () => {
    setCacheIdentity("user-a");
    tab.error = new Error("offline");
    const queryClient = new QueryClient();
    queryClient.setQueryData(USER_QUERY_KEYS.me, PROFILE);

    renderWithProviders(
      <UserProvider>
        <PinnedProbe />
      </UserProvider>,
      { queryClient },
    );

    expect(screen.getByText("Konzum Ilica")).toBeInTheDocument();
  });

  it("gives a signed-out visitor no saved profile", () => {
    setCacheIdentity(null);
    tab.error = new Error("offline");
    const queryClient = new QueryClient();
    queryClient.setQueryData(USER_QUERY_KEYS.me, PROFILE);

    renderWithProviders(
      <UserProvider>
        <PinnedProbe />
      </UserProvider>,
      { queryClient },
    );

    expect(screen.getByText("no pinned stores")).toBeInTheDocument();
  });
});
