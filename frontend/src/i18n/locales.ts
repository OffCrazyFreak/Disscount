export const LOCALES = ["hr", "en", "it", "sl", "de"] as const;

export type AppLocale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "hr";

// Written only when someone picks a language, never on a plain visit: that keeps it
// inside the ePrivacy exemption for user-interface customisation cookies.
export const LOCALE_COOKIE = "NEXT_LOCALE";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

// Endonyms: each language is listed in its own name, never translated.
export const LOCALE_NAMES: Record<AppLocale, string> = {
  hr: "Hrvatski",
  en: "English",
  it: "Italiano",
  sl: "Slovenščina",
  de: "Deutsch",
};

export const OPEN_GRAPH_LOCALES: Record<AppLocale, string> = {
  hr: "hr_HR",
  en: "en_GB",
  it: "it_IT",
  sl: "sl_SI",
  de: "de_DE",
};

export function isLocale(value: unknown): value is AppLocale {
  return typeof value === "string" && LOCALES.includes(value as AppLocale);
}
