import { screen } from "@testing-library/react";
import { useQuery } from "@tanstack/react-query";
import { http, HttpResponse } from "msw/http";
import { act, useSyncExternalStore } from "react";
import { describe, expect, it, vi } from "vitest";

import { UserProvider } from "@/context/user-context";
import apiClient from "@/lib/api/api-base";
import { actingAs, serverSession } from "@/test/backend-identity";
import { server } from "@/test/msw-server";
import { renderWithProviders } from "@/test/render";
import { storedUser } from "@/test/stored-user";

// Re-renders only readers, like better-auth's atom, so the landing session causes no re-render.
const sessionStore = vi.hoisted(() => {
  let state = { isPending: true, userId: null as string | null };
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    set(next: typeof state) {
      state = next;
      listeners.forEach((listener) => listener());
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
});

vi.mock("@/lib/auth/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/client")>();
  return {
    authClient: actual.authClient,
    useSession: () => {
      const { isPending, userId } = useSyncExternalStore(
        sessionStore.subscribe,
        sessionStore.get,
      );
      return {
        data: userId ? { user: { id: userId } } : null,
        isPending,
        error: null,
      };
    },
  };
});

vi.mock("@/i18n/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn() }),
}));

// The real purge; its IndexedDB buckets have their own tests.
vi.mock("@/lib/offline/persister", () => ({
  removePersistedCacheFor: vi.fn(async () => {}),
}));
vi.mock("@/lib/offline/card-photo-store", () => ({
  deleteForIdentity: vi.fn(async () => {}),
}));
vi.mock("@/lib/offline/card-photo-outbox", () => ({
  deleteOutboxForIdentity: vi.fn(async () => {}),
}));
vi.mock("@/lib/api/digital-cards/last-used", () => ({
  deleteUsedQueueForIdentity: vi.fn(async () => {}),
}));

function Probe() {
  const { data, isError } = useQuery({
    queryKey: ["probe"],
    queryFn: async () =>
      (await apiClient.get<{ account: string }>("/api/probe")).data,
  });
  if (data) return <p>as {data.account}</p>;
  return <p>{isError ? "failed" : "loading"}</p>;
}

describe("UserProvider after an OAuth return", () => {
  it("shows the new account's data once its session lands, though the first call was refused", async () => {
    serverSession.userId = "user-b";
    server.use(
      http.get("*/api/users/me", () =>
        HttpResponse.json({
          ...storedUser,
          id: "user-b",
          pinnedStores: [],
          pinnedPlaces: [],
        }),
      ),
      http.get("*/api/probe", ({ request }) =>
        HttpResponse.json({ account: actingAs(request) }),
      ),
    );

    renderWithProviders(
      <UserProvider>
        <Probe />
      </UserProvider>,
    );
    expect(await screen.findByText("failed")).toBeInTheDocument();

    act(() => sessionStore.set({ isPending: false, userId: "user-b" }));

    expect(await screen.findByText("as user-b")).toBeInTheDocument();
  });
});
