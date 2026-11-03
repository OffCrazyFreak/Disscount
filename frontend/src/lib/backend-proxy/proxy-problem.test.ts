import { describe, expect, it } from "vitest";

import { proxyProblem } from "@/lib/backend-proxy/proxy-problem";

function requestIn(acceptLanguage?: string) {
  return new Request("http://localhost:3000/api/me", {
    headers: acceptLanguage ? { "accept-language": acceptLanguage } : {},
  });
}

describe("proxyProblem", () => {
  it("titles the account switch in the language the tab sent", async () => {
    const response = proxyProblem("session_changed", requestIn("en"));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      status: 401,
      code: "session_changed",
      title: "Another account signed in. Refreshing your data.",
    });
  });

  it("matches a regional tag on its language", async () => {
    const response = proxyProblem(
      "backend_unavailable",
      requestIn("de-AT,de;q=0.9"),
    );

    expect((await response.json()).title).toBe("Dienst nicht verfügbar");
  });

  it("falls back to Croatian for a language the app does not ship", async () => {
    const response = proxyProblem("csrf_rejected", requestIn("fr"));

    expect((await response.json()).title).toBe(
      "Osvježi stranicu i pokušaj ponovno",
    );
  });
});
