import { SESSION_CHANGED } from "@/lib/backend-proxy/proxy-contract";

// The proxy's own refusals and failures, in the Problem Details shape problem-details.ts reads.
export type ProxyProblemCode =
  | "not_found"
  | "csrf_rejected"
  | typeof SESSION_CHANGED
  | "auth_unavailable"
  | "backend_unavailable"
  | "backend_timeout";

const PROBLEMS: Record<ProxyProblemCode, { status: number; title: string }> = {
  not_found: { status: 404, title: "Not Found" },
  csrf_rejected: { status: 403, title: "Forbidden" },
  [SESSION_CHANGED]: { status: 401, title: "Session changed" },
  auth_unavailable: { status: 503, title: "Service Unavailable" },
  backend_unavailable: { status: 502, title: "Bad Gateway" },
  backend_timeout: { status: 504, title: "Gateway Timeout" },
};

export function proxyProblem(code: ProxyProblemCode): Response {
  const { status, title } = PROBLEMS[code];
  return Response.json(
    { status, title, code },
    {
      status,
      headers: {
        "content-type": "application/problem+json",
        "cache-control": "private, no-store",
      },
    },
  );
}
