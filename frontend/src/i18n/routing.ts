import { defineRouting } from "next-intl/routing";
import { DEFAULT_LOCALE, LOCALES } from "@/i18n/locales";

export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  // Croatian keeps its existing, already indexed URLs; the rest get a prefix.
  localePrefix: "as-needed",
  // Google advises against redirecting by browser language, so only the URL decides.
  localeDetection: false,
  // hreflang comes from generateMetadata and the sitemap instead of Link headers.
  alternateLinks: false,
  // next-intl would rewrite this cookie on every visit; we write it only on an
  // explicit choice (see LOCALE_COOKIE).
  localeCookie: false,
});
