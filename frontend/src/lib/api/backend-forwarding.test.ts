import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { parse } from "node:url";

import { passthrough } from "msw";
import { http, HttpResponse } from "msw/http";
import { proxyRequest } from "next/dist/server/lib/router-utils/proxy-request";
import { afterEach, describe, expect, it } from "vitest";

import { server } from "@/test/msw-server";

const BACKEND = "http://backend.test";
const VISITOR = "93.140.10.20";
const CLOUDFLARE_EDGE = "172.70.1.2";

let frontend: Server | undefined;

afterEach(() => {
  frontend?.close();
  frontend = undefined;
});

// Stands in for the Next server: hands each request to the same proxy the /api rewrite
// uses, so the test pins what Spring receives, not what the rewrite rule looks like.
async function startFrontend(): Promise<string> {
  frontend = createServer((request, response) => {
    void proxyRequest(
      request,
      response,
      { ...parse(`${BACKEND}${request.url}`, true), query: {} },
      undefined,
      undefined,
      null,
    );
  });
  await new Promise<void>((resolve) =>
    frontend!.listen(0, "127.0.0.1", resolve),
  );
  const { port } = frontend.address() as AddressInfo;
  return `http://127.0.0.1:${port}`;
}

describe("backend calls forwarded by the Next server", () => {
  it("hands Spring the client IP and language headers exactly as Traefik sent them", async () => {
    const frontendUrl = await startFrontend();
    let backendHeaders: Headers | undefined;
    server.use(
      http.all(`${frontendUrl}/*`, () => passthrough()),
      http.post(`${BACKEND}/api/contact`, ({ request }) => {
        backendHeaders = request.headers;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const response = await fetch(`${frontendUrl}/api/contact`, {
      method: "POST",
      headers: {
        "X-Forwarded-For": `${VISITOR}, ${CLOUDFLARE_EDGE}`,
        "CF-Connecting-IP": VISITOR,
        "Accept-Language": "sl",
      },
      body: "{}",
    });

    expect(response.status).toBe(204);
    // ClientIp.java trusts only the last hop and CF-Connecting-IP behind a Cloudflare edge,
    // so an appended or rewritten hop would key the contact and photo limits on the frontend.
    expect(backendHeaders?.get("x-forwarded-for")).toBe(
      `${VISITOR}, ${CLOUDFLARE_EDGE}`,
    );
    expect(backendHeaders?.get("cf-connecting-ip")).toBe(VISITOR);
    // Spring localises its problem messages from this header.
    expect(backendHeaders?.get("accept-language")).toBe("sl");
  });
});
