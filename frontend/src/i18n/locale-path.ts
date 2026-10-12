import { DEFAULT_LOCALE, type AppLocale } from "@/i18n/locales";

/**
 * Prefixes an app path ("/products?q=x") for a locale, leaving Croatian bare.
 * For URLs handed to code outside the router: auth callbacks, email links, redirects.
 */
export function localePath(locale: AppLocale, path: string): string {
  if (locale === DEFAULT_LOCALE) return path;

  const [pathname, query] = path.split(/(?=[?#])/, 2);
  const prefixed = pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
  return query ? `${prefixed}${query}` : prefixed;
}
