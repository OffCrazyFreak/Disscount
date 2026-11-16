// Shared by the browser client and the proxy route: the CSRF header and the identity pin.

/** A static header a cross-origin page cannot send without a CORS preflight the proxy never answers. */
export const CLIENT_HEADER = "X-Disscount-Client";
export const CLIENT_HEADER_VALUE = "web";

/** The account the tab's cache belongs to (the cache identity), so the proxy never acts as another. */
export const USER_HEADER = "X-Disscount-User";

/** The proxy's answer when the session cookie names a different account than the tab. */
export const SESSION_CHANGED = "session_changed";

/** Upstream search problems the proxy forwards by code: an expired cursor restarts, a timeout is not retried. */
export const CURSOR_EXPIRED = "cursor_expired";
export const SEARCH_TIMEOUT = "search_timeout";

/** The proxy's failures it reports to Sentry itself, so the browser does not report them again. */
export const SERVER_REPORTED_PROBLEMS = [
  "auth_unavailable",
  "backend_unavailable",
  "backend_timeout",
] as const;
