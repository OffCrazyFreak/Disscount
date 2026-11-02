/**
 * Keeps one-time auth secrets out of everything the Sentry SDK sends. The password reset
 * link lands on a page as `?token=`, and verify-email and OAuth callbacks carry `token`,
 * `code` and `state` in request URLs, so URLs are scrubbed by their structure (query key,
 * reset path segment), never by matching message text. The server SDK attaches request
 * bodies as raw JSON strings, so sensitive fields are filtered there as well as as keys.
 */
const FILTERED = "[Filtered]";

const SENSITIVE_QUERY_PARAM =
  /(^|[?&#])(token|code|state|access_token|id_token)=[^&#\s"'\\]*/gi;

// better-auth's reset email links to this route with the token as a path segment.
const RESET_PASSWORD_PATH_TOKEN =
  /(\/api\/auth\/reset-password\/)[^/?#\s"'\\]+/gi;

const SENSITIVE_FIELD_NAMES = [
  "token",
  "password",
  "newPassword",
  "currentPassword",
];

const SENSITIVE_FIELDS = new Set(
  SENSITIVE_FIELD_NAMES.map((name) => name.toLowerCase()),
);

const SENSITIVE_JSON_FIELD = new RegExp(
  `("(?:${SENSITIVE_FIELD_NAMES.join("|")})"\\s*:\\s*)"(?:[^"\\\\]|\\\\.)*"`,
  "gi",
);

export function scrubString(text: string): string {
  return text
    .replace(SENSITIVE_QUERY_PARAM, `$1$2=${FILTERED}`)
    .replace(RESET_PASSWORD_PATH_TOKEN, `$1${FILTERED}`)
    .replace(SENSITIVE_JSON_FIELD, `$1"${FILTERED}"`);
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
  beforeSendTransaction: scrubSensitiveData,
  beforeSendSpan: scrubSensitiveData,
};
