import { tab } from "@/test/user-context-mocks";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw/http";
import { useForm } from "react-hook-form";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { UserProvider, useUser } from "@/context/user-context";
import { useFormDraft } from "@/hooks/use-form-draft";
import {
  getCacheIdentity,
  setCacheIdentity,
} from "@/lib/offline/cache-identity";
import { purgeOfflineCache } from "@/lib/offline/purge";
import { server } from "@/test/msw-server";
import { renderWithProviders } from "@/test/render";
import { storedUser } from "@/test/stored-user";

// The real purge awaits IndexedDB deletes, long enough for React to unmount the form.
beforeEach(() => {
  vi.mocked(purgeOfflineCache).mockImplementation(
    () => new Promise<void>((resolve) => setTimeout(resolve, 50)),
  );
});

function DraftedForm() {
  const form = useForm({ defaultValues: { username: "" } });
  useFormDraft({ draftKey: "settings", form });
  return <input aria-label="username" {...form.register("username")} />;
}

function AccountProbe() {
  const { logout, isAuthenticated } = useUser();
  return (
    <>
      <button onClick={() => logout()}>sign out</button>
      {isAuthenticated && <DraftedForm />}
    </>
  );
}

describe("UserProvider sign-out", () => {
  it("leaves nothing the account typed in the device's drafts", async () => {
    tab.userId = "user-a";
    setCacheIdentity("user-a");
    server.use(
      http.get("*/api/users/me", () =>
        HttpResponse.json({
          ...storedUser,
          id: "user-a",
          pinnedStores: [],
          pinnedPlaces: [],
        }),
      ),
      http.post("*/api/auth/sign-out", () => HttpResponse.json({})),
    );
    const user = userEvent.setup();
    renderWithProviders(
      <UserProvider>
        <AccountProbe />
      </UserProvider>,
    );

    await user.type(await screen.findByLabelText("username"), "Review Shots");
    await user.click(screen.getByRole("button", { name: "sign out" }));

    expect(screen.queryByLabelText("username")).not.toBeInTheDocument();
    await waitFor(() => expect(getCacheIdentity()).toBe("anon"));
    expect(localStorage.getItem("Disscount_app") ?? "").not.toContain(
      "Review Shots",
    );
  });
});
