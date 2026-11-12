import { http, HttpResponse } from "msw/http";
import { describe, expect, it } from "vitest";

import { postCardsUsed } from "@/lib/api/digital-cards/queries";
import { isUnexpectedFailure } from "@/lib/api/query-client-defaults";
import { server } from "@/test/msw-server";

describe("postCardsUsed", () => {
  it.each([
    [401, false],
    [403, false],
    [500, true],
  ])(
    "a %i from the keepalive flush is reported: %s",
    async (status, reported) => {
      server.use(
        http.post("*/api/digital-cards/used", () =>
          HttpResponse.json(null, { status }),
        ),
      );

      const error = await postCardsUsed(
        [{ id: "card-1", usedAt: "2026-11-03T10:00:00Z" }],
        { keepalive: true },
      ).then(
        () => expect.fail("the flush should have failed"),
        (failure: unknown) => failure,
      );

      expect(isUnexpectedFailure(error)).toBe(reported);
    },
  );
});
