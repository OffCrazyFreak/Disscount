import { isLocale, type AppLocale } from "@/i18n/locales";

// Matches on the primary subtag only, so "de-AT" and "en-US" still find a catalog.
export function browserLocale(
  languages: readonly string[] = navigator.languages,
): AppLocale | null {
  for (const tag of languages) {
    const primary = tag.toLowerCase().split("-")[0];

    if (isLocale(primary)) return primary;
  }

  return null;
}
