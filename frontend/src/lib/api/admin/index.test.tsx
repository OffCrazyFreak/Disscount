import { waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw/http";
import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import adminService from "@/lib/api/admin";
import { server } from "@/test/msw-server";
import { renderHookWithProviders } from "@/test/render";
import { storedUser } from "@/test/stored-user";

const { lastActiveAt: _omitted, ...driftedUser } = storedUser;

// The fetchers are module private, so they are reached through the hooks that own them.
describe("admin user fetchers", () => {
  it("rejects the whole user list when one user drifted", async () => {
    server.use(
      http.get("*/api/admin/users", () =>
        HttpResponse.json([storedUser, driftedUser]),
      ),
    );

    const { result } = renderHookWithProviders(() =>
      adminService.useGetAllUsers(),
    );

    await waitFor(() => expect(result.current.error).toBeInstanceOf(ZodError));
  });

  it("rejects an account type change answered with a drifted user", async () => {
    server.use(
      http.patch("*/api/admin/users/:id", () =>
        HttpResponse.json({ ...driftedUser, accountType: "ADMIN" }),
      ),
    );

    const { result } = renderHookWithProviders(() =>
      adminService.useUpdateUserAccountType(),
    );

    await expect(
      result.current.mutateAsync({
        userId: storedUser.id,
        accountType: "ADMIN",
      }),
    ).rejects.toBeInstanceOf(ZodError);
  });
});
