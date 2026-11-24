import { http, HttpResponse } from "msw/http";
import { describe, expect, it } from "vitest";

import {
  getAccountSessions,
  revokeAccountSession,
} from "@/lib/api/account-sessions/queries";
import { isUnexpectedFailure } from "@/lib/api/query-client-defaults";
import { server } from "@/test/msw-server";

async function failureOf(request: Promise<unknown>) {
  return request.then(
    () => expect.fail("the request should have failed"),
    (error: unknown) => error,
  );
}

describe("account sessions fetchers", () => {
  it.each([
    [401, false],
    [403, false],
    [500, true],
    [503, true],
  ])("a %i listing sessions is reported: %s", async (status, reported) => {
    server.use(
      http.get("*/api/account/sessions", () =>
        HttpResponse.json(null, { status }),
      ),
    );

    const error = await failureOf(getAccountSessions());

    expect(isUnexpectedFailure(error)).toBe(reported);
  });

  it.each([
    [401, false],
    [500, true],
  ])("a %i revoking a session is reported: %s", async (status, reported) => {
    server.use(
      http.delete("*/api/account/sessions/:id", () =>
        HttpResponse.json(null, { status }),
      ),
    );

    const error = await failureOf(revokeAccountSession("session-1"));

    expect(isUnexpectedFailure(error)).toBe(reported);
  });
});
