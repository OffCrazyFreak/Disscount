import type { AppLocale } from "@/i18n/locales";
import de from "@/i18n/messages/de/errorPage.json";
import en from "@/i18n/messages/en/errorPage.json";
import hr from "@/i18n/messages/hr/errorPage.json";
import it from "@/i18n/messages/it/errorPage.json";
import sl from "@/i18n/messages/sl/errorPage.json";

// global-error replaces the next-intl layout, so it reads catalogs directly, this namespace only.
export const GLOBAL_ERROR_MESSAGES: Record<AppLocale, typeof hr> = {
  hr,
  en,
  it,
  sl,
  de,
};
