/**
 * A share token is a bearer capability: anyone holding the URL can read, and depending on
 * the link level tick items off or edit them. It travels in the path of `/s/<token>` and
 * `/api/shared/<token>`, and Sentry attaches the page URL to every event, records fetch
 * breadcrumbs with the request URL, and replays navigations. `sendDefaultPii: false` does
 * not cover any of that, because it gates IP, cookies and headers rather than URLs.
 *
 * So the token is redacted from anything on its way out. Losing the exact value costs
 * nothing for debugging: the path shape is what identifies the route.
 */
const TOKEN_PATHS = /\/(s|api\/shared)\/[^/?#]+/g;

export function scrubShareToken<T>(value: T): T {
  if (typeof value !== "string") return value;
  return value.replace(TOKEN_PATHS, "/$1/[token]") as T;
}

/** Rewrites the string-valued URL fields Sentry puts on an event or breadcrumb. */
export function scrubEventUrls<
  T extends {
    request?: { url?: string } | undefined;
    breadcrumbs?: { data?: Record<string, unknown> }[] | undefined;
  },
>(event: T): T {
  if (event.request?.url) {
    event.request.url = scrubShareToken(event.request.url);
  }

  for (const breadcrumb of event.breadcrumbs ?? []) {
    if (breadcrumb.data) breadcrumb.data = scrubCrumbData(breadcrumb.data);
  }

  return event;
}

export function scrubCrumbData(
  data: Record<string, unknown>,
): Record<string, unknown> {
  const scrubbed: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    scrubbed[key] = scrubShareToken(value);
  }

  return scrubbed;
}
