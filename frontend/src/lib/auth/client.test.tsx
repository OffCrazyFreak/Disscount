import { renderHook, waitFor } from "@testing-library/react";
import { delay, http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { authClient, useSession } from "@/lib/auth/client";
import { server } from "@/test/msw-server";

// Named .tsx only for the jsdom project: the auth client needs a page origin.

function hangSessionLookup() {
  server.use(
    http.get("*/api/auth/get-session", async () => {
      await delay("infinite");
      return HttpResponse.json(null);
    }),
  );
}

describe("the session lookup on a weak signal", () => {
  it("ends a hanging lookup of the session hook with an error", async () => {
    hangSessionLookup();

    const { result } = renderHook(() => useSession());

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.error).not.toBeNull();
  });

  it("still answers a lookup that responds", async () => {
    server.use(
      http.get("*/api/auth/get-session", () => HttpResponse.json(null)),
    );

    const { error } = await authClient.getSession();

    expect(error).toBeNull();
  });
});
