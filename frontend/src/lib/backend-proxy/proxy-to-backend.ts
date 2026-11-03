import "server-only";

import * as Sentry from "@sentry/nextjs";

import { BACKEND_ORIGIN } from "@/lib/api/backend-origin";
import { backendUrl } from "@/lib/backend-proxy/backend-path";
import {
  downstreamResponseHeaders,
  upstreamRequestHeaders,
} from "@/lib/backend-proxy/forwarded-headers";
import {
  proxyProblem,
  type ProxyProblemCode,
} from "@/lib/backend-proxy/proxy-problem";
import {
  decideIdentity,
  identityPin,
  isCsrfSafe,
} from "@/lib/backend-proxy/request-guards";
import { mintSessionToken } from "@/lib/backend-proxy/session-token";
import { appUrl } from "@/lib/env";

// The cap the next.config.ts rewrite had, so a slow upload fails no sooner than before.
const UPSTREAM_TIMEOUT_MS = 30_000;
const BODYLESS_STATUSES = new Set([204, 304]);

function reportFailure(
  code: ProxyProblemCode,
  pathRoot: string,
  error: unknown,
) {
  // Only the root: deeper segments hold list and card ids, and headers carry the session.
  Sentry.captureException(error, {
    tags: { flow: "backend-proxy", proxyFailure: code, pathRoot },
  });
  return proxyProblem(code);
}

/** The token to forward with (null for an anonymous call), or the refusal to answer with. */
async function authorize(
  request: Request,
  pathRoot: string,
): Promise<{ token: string | null } | Response> {
  let session;
  try {
    session = await mintSessionToken(request.headers);
  } catch (error) {
    return reportFailure("auth_unavailable", pathRoot, error);
  }

  const identity = decideIdentity(
    identityPin(request),
    session?.userId ?? null,
  );
  if (identity.action === "refuse") return proxyProblem("session_changed");
  return { token: session?.token ?? null };
}

/** Spring's answer, or the proxy's own when Spring gave none. */
async function forward(
  request: Request,
  url: URL,
  token: string | null,
): Promise<{ upstream: Response } | Response> {
  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  try {
    const upstream = await fetch(url, {
      method: request.method,
      headers: upstreamRequestHeaders(request, token),
      body: hasBody ? request.body : undefined,
      // Node needs it for a streamed body; TypeScript's RequestInit lacks it.
      ...(hasBody ? { duplex: "half" } : {}),
      signal: AbortSignal.any([
        request.signal,
        AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      ]),
      redirect: "manual",
      cache: "no-store",
    });
    return { upstream };
  } catch (error) {
    // The browser went away; there is nobody to answer and nothing went wrong.
    if (request.signal.aborted) return new Response(null, { status: 499 });
    const isTimeout = error instanceof Error && error.name === "TimeoutError";
    const code = isTimeout ? "backend_timeout" : "backend_unavailable";
    return reportFailure(code, url.pathname.split("/")[2], error);
  }
}

function relay(request: Request, upstream: Response, timing: string) {
  const headers = downstreamResponseHeaders(upstream);
  headers.set("server-timing", timing);

  const isBodyless =
    request.method === "HEAD" || BODYLESS_STATUSES.has(upstream.status);
  // An unread body would hold the pooled connection to Spring open.
  if (isBodyless) void upstream.body?.cancel();
  return new Response(isBodyless ? null : upstream.body, {
    status: upstream.status,
    headers,
  });
}

/** Forwards one browser call to Spring as the signed-in account, with a token minted here. */
export async function proxyToBackend(
  request: Request,
  segments: string[],
): Promise<Response> {
  const url = backendUrl(segments, new URL(request.url).search, BACKEND_ORIGIN);
  if (!url) return proxyProblem("not_found");
  if (!isCsrfSafe(request, appUrl())) return proxyProblem("csrf_rejected");

  const authStart = performance.now();
  const authorized = await authorize(request, segments[0]);
  if (authorized instanceof Response) return authorized;

  const upstreamStart = performance.now();
  const forwarded = await forward(request, url, authorized.token);
  if (forwarded instanceof Response) return forwarded;

  const authMs = (upstreamStart - authStart).toFixed(1);
  const upstreamMs = (performance.now() - upstreamStart).toFixed(1);
  return relay(
    request,
    forwarded.upstream,
    `auth;dur=${authMs}, upstream;dur=${upstreamMs}`,
  );
}
