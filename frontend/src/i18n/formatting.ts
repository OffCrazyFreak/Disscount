import { DEFAULT_LOCALE, type AppLocale } from "@/i18n/locales";

// The server runs on UTC, so pinning the zone keeps output equal and shows Croatian store times as they are in Croatia.
export const TIME_ZONE = "Europe/Zagreb";

// Plain "en" formats dates the US way, so for a European audience pricing in euros, English follows British conventions.
const FORMAT_LOCALES: Record<AppLocale, string> = {
  hr: "hr-HR",
  en: "en-GB",
  it: "it-IT",
  sl: "sl-SI",
  de: "de-DE",
};

export function formatLocale(locale: string): string {
  return FORMAT_LOCALES[locale as AppLocale] ?? FORMAT_LOCALES[DEFAULT_LOCALE];
}
