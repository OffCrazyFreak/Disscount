import { AxiosError } from "axios";

import type { ProxyProblemCode } from "@/lib/backend-proxy/proxy-problem";

/** So callers can map an upstream failure onto a response without knowing that axios is underneath. */
export class CijeneApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public response?: unknown,
  ) {
    super(message);
    this.name = "CijeneApiError";
  }
}

/** Upstream details the proxy forwards as its own problem codes, so the browser can tell them apart. */
export const CURSOR_EXPIRED = "cursor_expired" satisfies ProxyProblemCode;
export const SEARCH_TIMEOUT = "search_timeout" satisfies ProxyProblemCode;

const STATUS_MESSAGES: Record<number, string> = {
  400: "Invalid request parameters",
  401: "Authentication failed - Invalid API token",
  403: "Access forbidden - Insufficient permissions",
  404: "Resource not found",
  409: "Conflict",
  429: "Rate limit exceeded - Please try again later",
  500: "Internal server error",
  502: "Service temporarily unavailable",
  503: "Service temporarily unavailable",
  504: "Service temporarily unavailable",
};

/** Status 0 means the request never landed. */
export function toCijeneApiError(error: AxiosError): CijeneApiError {
  const { response } = error;

  if (response) {
    const message =
      STATUS_MESSAGES[response.status] ||
      `Request failed with status ${response.status}`;

    return new CijeneApiError(response.status, message, response.data);
  }

  // Our proxy gave up on upstream, so this is a gateway timeout, not a slow caller.
  if (error.code === "ECONNABORTED") {
    return new CijeneApiError(504, "Upstream request timeout", null);
  }

  if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
    return new CijeneApiError(503, "Service unavailable", null);
  }

  return new CijeneApiError(0, error.message || "Network error", null);
}
