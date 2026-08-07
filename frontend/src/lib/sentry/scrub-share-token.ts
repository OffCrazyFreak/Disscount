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

interface IScrubbableEvent {
  request?: { url?: string };
  breadcrumbs?: { data?: Record<string, unknown> }[];
  spans?: { description?: string; data?: Record<string, unknown> }[];
  contexts?: { trace?: { data?: Record<string, unknown> } };
  exception?: { values?: { value?: string }[] };
  transaction?: string;
  message?: string;
}

/**
 * Rewrites every field Sentry can carry a URL in, not just `request.url`.
 *
 * A transaction event carries the URL again on each span (browser tracing records fetch
 * and resource spans), on `contexts.trace.data`, and in the transaction name. A failed
 * fetch puts it in the exception message. Missing any one of those leaks the token just
 * as effectively as missing all of them.
 */
export function scrubEventUrls<T extends IScrubbableEvent>(event: T): T {
  if (event.request?.url) {
    event.request.url = scrubShareToken(event.request.url);
  }
  if (event.transaction) event.transaction = scrubShareToken(event.transaction);
  if (event.message) event.message = scrubShareToken(event.message);

  for (const breadcrumb of event.breadcrumbs ?? []) {
    if (breadcrumb.data) breadcrumb.data = scrubCrumbData(breadcrumb.data);
  }

  for (const span of event.spans ?? []) {
    if (span.description) span.description = scrubShareToken(span.description);
    if (span.data) span.data = scrubCrumbData(span.data);
  }

  const traceData = event.contexts?.trace?.data;
  if (traceData && event.contexts?.trace) {
    event.contexts.trace.data = scrubCrumbData(traceData);
  }

  for (const value of event.exception?.values ?? []) {
    if (value.value) value.value = scrubShareToken(value.value);
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
