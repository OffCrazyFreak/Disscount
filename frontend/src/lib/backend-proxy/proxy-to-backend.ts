import "server-only";

import * as Sentry from "@sentry/nextjs";

import { BACKEND_ORIGIN } from "@/lib/api/backend-origin";
import { backendUrl, docsUrl } from "@/lib/backend-proxy/backend-path";
import {
  downstreamResponseHeaders,
  upstreamRequestHeaders,
} from "@/lib/backend-proxy/forwarded-headers";
import type { SERVER_REPORTED_PROBLEMS } from "@/lib/backend-proxy/proxy-contract";
import { proxyProblem } from "@/lib/backend-proxy/proxy-problem";
import {
  decideIdentity,
  identityPin,
  isCsrfSafe,
} from "@/lib/backend-proxy/request-guards";
import {
  bodyLimit,
  JSON_BODY_LIMIT,
  readBodyWithin,
  TOO_LARGE,
} from "@/lib/backend-proxy/request-body";
import { mintSessionToken } from "@/lib/backend-proxy/session-token";
import { appUrl } from "@/lib/env";

// Generous so a slow upload does not fail early; it covers reading the body and Spring's answer together.
const REQUEST_TIMEOUT_MS = 30_000;
const BODYLESS_STATUSES = new Set([204, 304]);

function reportFailure(
  request: Request,
  code: (typeof SERVER_REPORTED_PROBLEMS)[number],
  pathRoot: string,
  error: unknown,
) {
  // Only the root: deeper segments hold list and card ids, and headers carry the session.
  Sentry.captureException(error, {
    tags: { flow: "backend-proxy", proxyFailure: code, pathRoot },
  });
  return proxyProblem(code, request);
}

async function authorize(
  request: Request,
  pathRoot: string,
): Promise<{ token: string | null } | Response> {
  let session;
  try {
    session = await mintSessionToken(request.headers);
  } catch (error) {
    return reportFailure(request, "auth_unavailable", pathRoot, error);
  }

  const identity = decideIdentity(
    identityPin(request),
    session?.userId ?? null,
  );
  if (identity.action === "refuse")
    return proxyProblem("session_changed", request);
  return { token: session?.token ?? null };
}

function requestDeadline(request: Request): AbortSignal {
  return AbortSignal.any([
    request.signal,
    AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  ]);
}

function isTimeout(reason: unknown): boolean {
  return reason instanceof Error && reason.name === "TimeoutError";
}

async function readBody(
  request: Request,
  limit: number,
  deadline: AbortSignal,
): Promise<Uint8Array<ArrayBuffer> | undefined | Response> {
  try {
    const body = await readBodyWithin(request, limit, deadline);

    return body === TOO_LARGE
      ? proxyProblem("payload_too_large", request)
      : body;
  } catch (error) {
    if (request.signal.aborted) return new Response(null, { status: 499 });

    return proxyProblem(
      isTimeout(error) ? "request_timeout" : "bad_request",
      request,
    );
  }
}

async function forward(
  request: Request,
  url: URL,
  token: string | null,
  body: Uint8Array<ArrayBuffer> | undefined,
  deadline: AbortSignal,
): Promise<{ upstream: Response } | Response> {
  try {
    const upstream = await fetch(url, {
      method: request.method,
      headers: upstreamRequestHeaders(request, token),
      body,
      signal: deadline,
      redirect: "manual",
      cache: "no-store",
    });
    return { upstream };
  } catch (error) {
    // The browser went away; there is nobody to answer and nothing went wrong.
    if (request.signal.aborted) return new Response(null, { status: 499 });
    const code = isTimeout(error) ? "backend_timeout" : "backend_unavailable";
    return reportFailure(request, code, url.pathname.split("/")[2], error);
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

export async function proxyToBackend(
  request: Request,
  segments: string[],
): Promise<Response> {
  const url = backendUrl(segments, new URL(request.url).search, BACKEND_ORIGIN);
  if (!url) return proxyProblem("not_found", request);
  if (!isCsrfSafe(request, appUrl()))
    return proxyProblem("csrf_rejected", request);

  const authStart = performance.now();
  const authorized = await authorize(request, segments[0]);
  if (authorized instanceof Response) return authorized;

  // Every route with a larger cap needs a login, so a stranger never makes the proxy hold more than a JSON body.
  const limit = bodyLimit(request.method, segments);
  if (limit > JSON_BODY_LIMIT && !authorized.token)
    return proxyProblem("sign_in_required", request);

  const bodyStart = performance.now();
  const deadline = requestDeadline(request);
  const body = await readBody(request, limit, deadline);
  if (body instanceof Response) return body;

  const upstreamStart = performance.now();
  const forwarded = await forward(
    request,
    url,
    authorized.token,
    body,
    deadline,
  );
  if (forwarded instanceof Response) return forwarded;

  const authMs = (bodyStart - authStart).toFixed(1);
  const bodyMs = (upstreamStart - bodyStart).toFixed(1);
  const upstreamMs = (performance.now() - upstreamStart).toFixed(1);
  return relay(
    request,
    forwarded.upstream,
    `auth;dur=${authMs}, body;dur=${bodyMs}, upstream;dur=${upstreamMs}`,
  );
}

/** The API docs are public, so a browser opens them directly: no client header, no session and no body. */
export async function proxyDocsToBackend(
  request: Request,
  segments: string[],
): Promise<Response> {
  const url = docsUrl(segments, new URL(request.url).search, BACKEND_ORIGIN);
  if (!url) return proxyProblem("not_found", request);

  const upstreamStart = performance.now();
  const forwarded = await forward(
    request,
    url,
    null,
    undefined,
    requestDeadline(request),
  );
  if (forwarded instanceof Response) return forwarded;

  const upstreamMs = (performance.now() - upstreamStart).toFixed(1);
  return relay(request, forwarded.upstream, `upstream;dur=${upstreamMs}`);
}
