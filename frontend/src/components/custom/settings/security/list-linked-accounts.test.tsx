import { http, HttpResponse } from "msw/http";
import { describe, expect, it } from "vitest";

import { listLinkedAccounts } from "@/components/custom/settings/security/list-linked-accounts";
import { isUnexpectedFailure } from "@/lib/api/query-client-defaults";
import { server } from "@/test/msw-server";

describe("listLinkedAccounts", () => {
  it.each([
    [401, false],
    [500, true],
  ])("a %i is reported: %s", async (status, reported) => {
    server.use(
      http.get("*/api/auth/list-accounts", () =>
        HttpResponse.json({ message: "nope" }, { status }),
      ),
    );

    const error = await listLinkedAccounts().then(
      () => expect.fail("the request should have failed"),
      (failure: unknown) => failure,
    );

    expect(isUnexpectedFailure(error)).toBe(reported);
  });

  it("returns the provider and the account row id unlink takes", async () => {
    server.use(
      http.get("*/api/auth/list-accounts", () =>
        HttpResponse.json([
          { providerId: "credential", accountId: "a1", id: "x", scopes: [] },
        ]),
      ),
    );

    await expect(listLinkedAccounts()).resolves.toEqual([
      { id: "x", providerId: "credential" },
    ]);
  });
});
