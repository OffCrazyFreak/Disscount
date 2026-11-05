import type { AppLocale } from "@/i18n/locales";
import hr from "@/i18n/messages/hr/locale.json";
import en from "@/i18n/messages/en/locale.json";
import it from "@/i18n/messages/it/locale.json";
import sl from "@/i18n/messages/sl/locale.json";
import de from "@/i18n/messages/de/locale.json";

// The banner offering a switch speaks the language it offers, since the reader may
// not understand the page they are on, and only the current catalog is loaded.
export const SHOW_IN_LOCALE: Record<AppLocale, string> = {
  hr: hr.showInThisLanguage,
  en: en.showInThisLanguage,
  it: it.showInThisLanguage,
  sl: sl.showInThisLanguage,
  de: de.showInThisLanguage,
};
