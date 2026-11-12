import { APIError } from "better-auth/api";
import { http, HttpResponse } from "msw";
import type { Mock } from "vitest";

import { proxyToBackend } from "@/lib/backend-proxy/proxy-to-backend";
import { server } from "@/test/msw-server";

// Callers mock server-only, @/lib/auth and @sentry/nextjs before importing this.

export const APP = "http://localhost:3000";
export const BACKEND = "http://localhost:8080";

export function signedToken(sub: string) {
  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "ES256" })}.${encode({ sub })}.signature`;
}

/** Stands in for better-auth's getToken: the test cookie names the account whose session it is. */
export function signTokensFromCookie(getToken: Mock) {
  getToken.mockImplementation(async ({ headers }: { headers: Headers }) => {
    const userId = /session=([\w-]+)/.exec(headers.get("cookie") ?? "")?.[1];
    if (!userId) {
      throw new APIError("UNAUTHORIZED", { message: "Unauthorized" });
    }
    return { token: signedToken(userId) };
  });
}

interface ICallOptions {
  method?: string;
  pin?: string;
  session?: string;
  headers?: Record<string, string>;
  body?: BodyInit;
  signal?: AbortSignal;
}

export function call(path: string, options: ICallOptions = {}) {
  const { method = "GET", pin = "anon", session, signal, body } = options;
  const headers = new Headers({
    "X-Disscount-Client": "web",
    "X-Disscount-User": pin,
    "Sec-Fetch-Site": "same-origin",
    ...options.headers,
  });
  if (session) headers.set("cookie", `session=${session}`);

  const url = new URL(path, APP);
  const request = new Request(url, {
    method,
    headers,
    body,
    signal,
    ...(body ? { duplex: "half" } : {}),
  });
  const segments = url.pathname.split("/").slice(2).map(decodeURIComponent);
  return proxyToBackend(request, segments);
}

export function backend(answer: () => Response = () => HttpResponse.json({})) {
  const received: Request[] = [];
  server.use(
    http.all(`${BACKEND}/api/*`, ({ request }) => {
      received.push(request.clone());
      return answer();
    }),
  );
  return received;
}
