import { DEFAULT_LOCALE, isLocale, type AppLocale } from "@/i18n/locales";

/** For URLs handed to code outside the router: auth callbacks, email links, redirects. */
export function localePath(locale: AppLocale, path: string): string {
  if (locale === DEFAULT_LOCALE) return path;

  const cut = path.search(/[?#]/);
  const pathname = cut === -1 ? path : path.slice(0, cut);
  const suffix = cut === -1 ? "" : path.slice(cut);
  const prefixed = pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
  return `${prefixed}${suffix}`;
}

/** Reads the locale back out of a browser path, for code that runs without next-intl. */
export function localeFromPath(pathname: string): AppLocale {
  const segment = pathname.split("/")[1];
  return isLocale(segment) ? segment : DEFAULT_LOCALE;
}
