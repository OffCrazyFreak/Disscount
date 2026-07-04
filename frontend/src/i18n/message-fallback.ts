import { IntlErrorCode, type IntlError } from "next-intl";

import hrMessages from "./messages/hr.json";

interface FallbackArgs {
  namespace?: string;
  key: string;
  error: IntlError;
}

// Parity is enforced (pnpm i18n:check + the ESLint rule), so a missing key
// should never ship. If one somehow slips through, resolve it from the default
// (hr) catalog rather than surfacing the raw "namespace.key" path to the user.
export function getMessageFallback({ namespace, key }: FallbackArgs): string {
  const path = namespace ? `${namespace}.${key}` : key;

  const resolved = path.split(".").reduce<unknown>(
    (value, segment) =>
      value && typeof value === "object"
        ? (value as Record<string, unknown>)[segment]
        : undefined,
    hrMessages,
  );

  return typeof resolved === "string" ? resolved : path;
}

// A missing message is handled by getMessageFallback above, so don't let
// next-intl throw (its dev default) for it. Everything else is still logged.
export function onIntlError(error: IntlError): void {
  if (error.code === IntlErrorCode.MISSING_MESSAGE) return;
  console.error(error);
}
