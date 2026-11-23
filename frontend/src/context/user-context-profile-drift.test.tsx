import { tab } from "@/test/fixtures/user-context-mocks";
import { screen, waitFor } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
import * as Sentry from "@sentry/nextjs";
import { http, HttpResponse } from "msw/http";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";

import { UserProvider, useUser } from "@/context/user-context";
import { createQueryClientConfig } from "@/lib/api/query-client-defaults";
import { setCacheIdentity } from "@/lib/offline/cache/cache-identity";
import { server } from "@/test/msw-server";
import { renderWithProviders } from "@/test/render";
import { storedUser } from "@/test/fixtures/stored-user";

const { accountType: _omitted, ...driftedProfile } = storedUser;

function Probe() {
  const { user, isAuthenticated, isLoading } = useUser();
  if (isLoading) return <p>loading</p>;
  return <p>{isAuthenticated ? `profile ${user?.id}` : "no profile"}</p>;
}

function serveProfile(body: object) {
  server.use(http.get("*/api/users/me", () => HttpResponse.json(body)));
  // The app's own client, since its query cache is what reports the drift.
  renderWithProviders(
    <UserProvider>
      <Probe />
    </UserProvider>,
    { queryClient: new QueryClient(createQueryClientConfig()) },
  );
}

beforeEach(() => {
  tab.userId = "user-a";
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
        expect.objectContaining({
          tags: expect.objectContaining({ queryKeyRoot: "users" }),
        }),
      ),
    );
  });
});
