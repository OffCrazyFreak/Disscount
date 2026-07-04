// Single source of truth for the app's locales. Imported by the request config,
// the locale server action, and the language switcher so adding a language is a
// one-line change here (plus a matching messages/<locale>.json catalog).
export const locales = ["hr", "en", "de", "sl"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "hr";

// next-intl's default cookie name. Kept as a constant so the action that writes
// it and the request config that reads it can never drift apart.
export const LOCALE_COOKIE = "NEXT_LOCALE";

// Global default time zone for date/number formatting. Fixed (not per-request)
// so server and client render identical markup and never mismatch on hydration.
// Croatia is the launch market; all current markets (HR/AT/SI) share CET.
export const TIME_ZONE = "Europe/Zagreb";

export function isLocale(value: string | undefined): value is Locale {
  return value !== undefined && locales.includes(value as Locale);
}

// Picks the best supported locale from an `Accept-Language` header value, so a
// first-time visitor (no cookie yet) sees the app in their browser's language.
// Matches on the primary subtag (e.g. "de-AT" -> "de"), honoring q-weights, and
// returns undefined when nothing matches so the caller can fall back.
export function matchLocale(
  acceptLanguage: string | null | undefined,
): Locale | undefined {
  if (!acceptLanguage) return undefined;

  const ranked = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const quality = params
        .map((p) => p.trim())
        .find((p) => p.startsWith("q="));

      return {
        base: tag.trim().toLowerCase().split("-")[0],
        quality: quality ? parseFloat(quality.slice(2)) : 1,
      };
    })
    .filter((entry) => entry.base && !Number.isNaN(entry.quality))
    .sort((a, b) => b.quality - a.quality);

  return ranked.map((entry) => entry.base).find(isLocale);
}
