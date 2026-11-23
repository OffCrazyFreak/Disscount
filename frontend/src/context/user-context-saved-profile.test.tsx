import { tab } from "@/test/user-context-mocks";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import {
  defaultShouldDehydrateQuery,
  QueryClient,
} from "@tanstack/react-query";
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

function SignedInProbe() {
  const { user, isAuthenticated } = useUser();
  return (
    <p>{isAuthenticated ? `signed in as ${user?.username}` : "signed out"}</p>
  );
}

/** A device that saved the profile earlier, so the provider refetches it on mount. */
function renderWithSavedProfile(answer: () => Response) {
  setCacheIdentity("user-a");
  tab.userId = "user-a";
  server.use(http.get("*/api/users/me", answer));
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  queryClient.setQueryData(USER_QUERY_KEYS.me, PROFILE, { updatedAt: 0 });

  renderWithProviders(
    <UserProvider>
      <SignedInProbe />
    </UserProvider>,
    { queryClient },
  );
  return queryClient;
}

function PinButton() {
  const { updatePinnedStores } = useUser();
  return <button onClick={() => updatePinnedStores([])}>unpin all</button>;
}

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

describe("UserProvider when a profile refetch fails", () => {
  it("stays signed in with the saved profile, and keeps it for the offline snapshot, on a server error", async () => {
    let attempts = 0;
    const queryClient = renderWithSavedProfile(() => {
      attempts += 1;
      return HttpResponse.json({}, { status: 503 });
    });

    await waitFor(() => expect(attempts).toBe(1));
    expect(await screen.findByText("signed in as ana")).toBeInTheDocument();
    const query = queryClient
      .getQueryCache()
      .find({ queryKey: USER_QUERY_KEYS.me });
    await waitFor(() => expect(query?.state.fetchStatus).toBe("idle"));
    expect(query && defaultShouldDehydrateQuery(query)).toBe(true);
  });

  it("stays signed in with the saved profile when no answer comes back", async () => {
    renderWithSavedProfile(() => HttpResponse.error());

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.getByText("signed in as ana")).toBeInTheDocument();
  });

  it("reads as signed out when the server refuses the refetch", async () => {
    renderWithSavedProfile(() => HttpResponse.json({}, { status: 403 }));

    expect(await screen.findByText("signed out")).toBeInTheDocument();
  });
});

describe("UserProvider pinned store edits", () => {
  it("leaves the saved profile alone once the device belongs to another account", async () => {
    setCacheIdentity("user-b");
    tab.error = new Error("offline");
    const queryClient = new QueryClient();
    queryClient.setQueryData(USER_QUERY_KEYS.me, PROFILE);

    renderWithProviders(
      <UserProvider>
        <PinButton />
      </UserProvider>,
      { queryClient },
    );
    fireEvent.click(screen.getByRole("button", { name: "unpin all" }));

    expect(queryClient.getQueryData(USER_QUERY_KEYS.me)).toEqual(PROFILE);
  });

  it("saves the edit into the profile the offline snapshot keeps", async () => {
    setCacheIdentity("user-a");
    tab.userId = "user-a";
    server.use(http.get("*/api/users/me", () => HttpResponse.json(PROFILE)));
    const queryClient = new QueryClient();

    renderWithProviders(
      <UserProvider>
        <PinnedProbe />
        <PinButton />
      </UserProvider>,
      { queryClient },
    );
    await screen.findByText("Konzum Ilica");
    fireEvent.click(screen.getByRole("button", { name: "unpin all" }));

    expect(await screen.findByText("no pinned stores")).toBeInTheDocument();
    expect(queryClient.getQueryData(USER_QUERY_KEYS.me)).toMatchObject({
      pinnedStores: [],
    });
  });
});

describe("UserProvider pinned store edits during a refetch", () => {
  it("keeps the edit when a refetch started before it answers afterwards", async () => {
    setCacheIdentity("user-a");
    tab.userId = "user-a";
    const held: Array<() => void> = [];
    server.use(
      http.get(
        "*/api/users/me",
        () =>
          new Promise<Response>((resolve) =>
            held.push(() => resolve(HttpResponse.json(PROFILE))),
          ),
      ),
    );
    const queryClient = new QueryClient();
    queryClient.setQueryData(USER_QUERY_KEYS.me, PROFILE, { updatedAt: 0 });

    renderWithProviders(
      <UserProvider>
        <PinnedProbe />
        <PinButton />
      </UserProvider>,
      { queryClient },
    );
    await waitFor(() => expect(held.length).toBe(1));
    fireEvent.click(screen.getByRole("button", { name: "unpin all" }));
    await waitFor(() =>
      expect(queryClient.getQueryData(USER_QUERY_KEYS.me)).toMatchObject({
        pinnedStores: [],
      }),
    );

    held[0]();
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(queryClient.getQueryData(USER_QUERY_KEYS.me)).toMatchObject({
      pinnedStores: [],
    });
  });

  it("does not mark the saved profile fresh when the edit does not apply", async () => {
    setCacheIdentity("user-b");
    tab.error = new Error("offline");
    const queryClient = new QueryClient();
    queryClient.setQueryData(USER_QUERY_KEYS.me, PROFILE, { updatedAt: 0 });

    renderWithProviders(
      <UserProvider>
        <PinButton />
      </UserProvider>,
      { queryClient },
    );
    fireEvent.click(screen.getByRole("button", { name: "unpin all" }));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(queryClient.getQueryState(USER_QUERY_KEYS.me)?.dataUpdatedAt).toBe(
      0,
    );
  });
});
