// Shared by the browser client and the proxy route: the CSRF header and the identity pin.

/** A static header a cross-origin page cannot send without a CORS preflight the proxy never answers. */
export const CLIENT_HEADER = "X-Disscount-Client";
export const CLIENT_HEADER_VALUE = "web";

/** The account the tab's cache belongs to (the cache identity), so the proxy never acts as another. */
export const USER_HEADER = "X-Disscount-User";

/** The proxy's answer when the session cookie names a different account than the tab. */
export const SESSION_CHANGED = "session_changed";
