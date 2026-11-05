/**
 * Keeps one-time auth secrets out of everything the Sentry SDK sends. The password reset
 * link lands on a page as `?token=`, and verify-email and OAuth callbacks carry `token`,
 * `code` and `state` in request URLs, so URLs are scrubbed by their structure (query key,
 * reset path segment), never by matching message text. The server SDK attaches request
 * bodies as raw JSON or form-encoded strings, so sensitive fields are filtered there as
 * well as as keys. Cookies and the Authorization header carry the session, so they go too,
 * as keys and also as values wherever they turn up in text.
 */
const FILTERED = "[Filtered]";

// better-auth's reset email links to this route with the token as a path segment.
const RESET_PASSWORD_PATH_TOKEN =
  /(\/api\/auth\/reset-password\/)[^/?#\s"'\\]+/gi;

const SENSITIVE_FIELD_NAMES = [
  "token",
  "password",
  "newPassword",
  "currentPassword",
  "cookie",
  "cookies",
  "set-cookie",
  "authorization",
];

// Every better-auth cookie (session_token, session_data, dont_remember, ...), including the
// __Secure- and __Host- forms it uses over HTTPS. The value ends where a cookie header's does.
const BETTER_AUTH_COOKIE =
  /((?:__Secure-|__Host-)?better-auth\.[\w.-]+=)(?:"[^"]*"|[^;,\s"'\\]*)/gi;

// RFC 6750 token68 characters; the length floor spares prose like "the bearer of".
const BEARER_TOKEN = /(\bBearer\s+)[\w.~+/-]{8,}=*/gi;

const URL_SECRET_PARAMS = ["code", "state", "access_token", "id_token"];

// Also matches form-encoded bodies, which share the query string syntax.
const SENSITIVE_QUERY_PARAM = new RegExp(
  `(^|[?&#])(${[...URL_SECRET_PARAMS, ...SENSITIVE_FIELD_NAMES].join("|")})=[^&#\\s"'\\\\]*`,
  "gi",
);

const SENSITIVE_FIELDS = new Set(
  SENSITIVE_FIELD_NAMES.map((name) => name.toLowerCase()),
);

const SENSITIVE_JSON_FIELD = new RegExp(
  `("(?:${SENSITIVE_FIELD_NAMES.join("|")})"\\s*:\\s*)"(?:[^"\\\\]|\\\\.)*"`,
  "gi",
);

// A one-time code in a raw JSON body. An UPPER_SNAKE value is an error code, worth keeping.
const ONE_TIME_CODE_JSON_FIELD =
  /("code"\s*:\s*)"(?![A-Z][A-Z0-9_]*")(?:[^"\\]|\\.)*"/g;

export function scrubString(text: string): string {
  return text
    .replace(SENSITIVE_QUERY_PARAM, `$1$2=${FILTERED}`)
    .replace(RESET_PASSWORD_PATH_TOKEN, `$1${FILTERED}`)
    .replace(SENSITIVE_JSON_FIELD, `$1"${FILTERED}"`)
    .replace(ONE_TIME_CODE_JSON_FIELD, `$1"${FILTERED}"`)
    .replace(BETTER_AUTH_COOKIE, `$1${FILTERED}`)
    .replace(BEARER_TOKEN, `$1${FILTERED}`);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) return false;

  const prototype = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
}

function scrubValue(value: unknown, copies: WeakMap<object, unknown>): unknown {
  if (typeof value === "string") return scrubString(value);

  if (!Array.isArray(value) && !isPlainObject(value)) return value;

  // Breadcrumb data can hold raw console arguments, which may be circular.
  const existingCopy = copies.get(value);
  if (existingCopy) return existingCopy;

  if (Array.isArray(value)) {
    const copy: unknown[] = [];
    copies.set(value, copy);
    for (const item of value) copy.push(scrubValue(item, copies));

    return copy;
  }

  const copy: Record<string, unknown> = {};
  copies.set(value, copy);
  for (const [key, entry] of Object.entries(value)) {
    copy[key] = SENSITIVE_FIELDS.has(key.toLowerCase())
      ? FILTERED
      : scrubValue(entry, copies);
  }

  return copy;
}

export function scrubSensitiveData<T>(data: T): T {
  return scrubValue(data, new WeakMap()) as T;
}

// Spread into every Sentry.init (client, server, edge) so they scrub the same hooks.
export const sentryScrubbingOptions = {
  beforeBreadcrumb: scrubSensitiveData,
  beforeSend: scrubSensitiveData,
  beforeSendSpan: scrubSensitiveData,
};
