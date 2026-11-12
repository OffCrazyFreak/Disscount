// Allow-lists, so browsers cannot smuggle Authorization, and encoding headers never describe a decoded body.

const REQUEST_HEADERS = [
  "accept",
  // Spring localises its problem messages from this.
  "accept-language",
  // Carries the multipart boundary for photo uploads.
  "content-type",
  "if-none-match",
  "if-modified-since",
  // Verbatim, because ClientIp.java and the contact and photo limiters key on them.
  "x-forwarded-for",
  "cf-connecting-ip",
];

const RESPONSE_HEADERS = [
  "content-type",
  "cache-control",
  "etag",
  "last-modified",
  "location",
  "content-disposition",
  "retry-after",
  "x-content-type-options",
];

// Without a cache-control of Spring's own, neither Cloudflare nor the browser may keep an account's data.
const DEFAULT_CACHE_CONTROL = "private, no-store";

function pick(source: Headers, names: string[]): Headers {
  const picked = new Headers();
  for (const name of names) {
    const value = source.get(name);
    if (value !== null) picked.set(name, value);
  }
  return picked;
}

export function upstreamRequestHeaders(
  request: Request,
  token: string | null,
): Headers {
  const headers = pick(request.headers, REQUEST_HEADERS);
  if (token) headers.set("authorization", `Bearer ${token}`);
  return headers;
}

export function downstreamResponseHeaders(upstream: Response): Headers {
  const headers = pick(upstream.headers, RESPONSE_HEADERS);
  if (!headers.has("cache-control")) {
    headers.set("cache-control", DEFAULT_CACHE_CONTROL);
  }
  return headers;
}
