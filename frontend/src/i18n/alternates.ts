import { appUrl } from "@/lib/env";
import { getPathname } from "@/i18n/navigation";
import { DEFAULT_LOCALE, LOCALES, type AppLocale } from "@/i18n/locales";

export function localizedUrl(href: string, locale: AppLocale): string {
  return `${appUrl()}${getPathname({ href, locale })}`;
}

/**
 * hreflang set for one page: every language plus x-default pointing at Croatian.
 * Google ignores the set unless each version lists itself and all the others.
 */
export function languageAlternates(href: string): Record<string, string> {
  const languages: Record<string, string> = Object.fromEntries(
    LOCALES.map((locale) => [locale, localizedUrl(href, locale)]),
  );
  languages["x-default"] = localizedUrl(href, DEFAULT_LOCALE);
  return languages;
}

export function pageAlternates(href: string, locale: AppLocale) {
  return {
    canonical: localizedUrl(href, locale),
    languages: languageAlternates(href),
  };
}
