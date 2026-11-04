import { screen, waitFor } from "@testing-library/react";
import * as Sentry from "@sentry/nextjs";
import { http, HttpResponse } from "msw/http";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";

import { UserProvider, useUser } from "@/context/user-context";
import { setCacheIdentity } from "@/lib/offline/cache-identity";
import { server } from "@/test/msw-server";
import { renderWithProviders } from "@/test/render";
import { storedUser } from "@/test/stored-user";

vi.mock("@/lib/auth/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/client")>();
  return {
    authClient: actual.authClient,
    useSession: () => ({
      data: { user: { id: "user-a" } },
      isPending: false,
      error: null,
    }),
  };
});

vi.mock("@/i18n/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/lib/offline/purge", () => ({ purgeOfflineCache: vi.fn() }));

vi.mock("@sentry/nextjs", () => ({
  setUser: vi.fn(),
  captureException: vi.fn(),
}));

const { accountType: _omitted, ...driftedProfile } = storedUser;

function Probe() {
  const { user, isAuthenticated, isLoading } = useUser();
  if (isLoading) return <p>loading</p>;
  return <p>{isAuthenticated ? `profile ${user?.id}` : "no profile"}</p>;
}

function serveProfile(body: object) {
  server.use(http.get("*/api/users/me", () => HttpResponse.json(body)));
  renderWithProviders(
    <UserProvider>
      <Probe />
    </UserProvider>,
  );
}

beforeEach(() => {
  setCacheIdentity(null);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("UserProvider with a profile the schema refuses", () => {
  it("treats it as a load error and reports the drift", async () => {
    serveProfile(driftedProfile);

    expect(await screen.findByText("no profile")).toBeInTheDocument();
    await waitFor(() =>
      expect(Sentry.captureException).toHaveBeenCalledWith(
        expect.any(ZodError),
      ),
    );
  });
});
