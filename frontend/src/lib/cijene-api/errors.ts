import { AxiosError } from "axios";

/**
 * Thrown by every Cijene client so callers can map an upstream failure onto a
 * response without knowing that axios is underneath.
 */
export class CijeneApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public response?: unknown
  ) {
    super(message);
    this.name = "CijeneApiError";
  }
}

const STATUS_MESSAGES: Record<number, string> = {
  400: "Invalid request parameters",
  401: "Authentication failed - Invalid API token",
  403: "Access forbidden - Insufficient permissions",
  404: "Resource not found",
  429: "Rate limit exceeded - Please try again later",
  500: "Internal server error",
  502: "Service temporarily unavailable",
  503: "Service temporarily unavailable",
  504: "Service temporarily unavailable",
};

/**
 * Translates an axios failure into a CijeneApiError, keeping the upstream
 * status where there is one. Status 0 means the request never landed.
 */
export function toCijeneApiError(error: AxiosError): CijeneApiError {
  const { response } = error;

  if (response) {
    const message =
      STATUS_MESSAGES[response.status] ||
      `Request failed with status ${response.status}`;

    return new CijeneApiError(response.status, message, response.data);
  }

  // Our proxy gave up waiting on upstream, which is a gateway timeout rather
  // than the caller being slow.
  if (error.code === "ECONNABORTED") {
    return new CijeneApiError(504, "Upstream request timeout", null);
  }

  if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
    return new CijeneApiError(503, "Service unavailable", null);
  }

  return new CijeneApiError(0, error.message || "Network error", null);
}
