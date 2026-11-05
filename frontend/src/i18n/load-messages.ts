import type { AbstractIntlMessages } from "next-intl";
import { DEFAULT_LOCALE, type AppLocale } from "@/i18n/locales";
import hrMessages from "@/i18n/messages/hr";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function mergeOver(
  base: Record<string, unknown>,
  override: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...base };

  for (const [key, value] of Object.entries(override)) {
    const baseValue = base[key];
    result[key] =
      isPlainObject(baseValue) && isPlainObject(value)
        ? mergeOver(baseValue, value)
        : value;
  }

  return result;
}

/**
 * A key missing from a translation falls back to the Croatian text rather than
 * rendering the raw key. scripts/check-i18n.mjs keeps the catalogs in step, so
 * this only matters while a translation is still in progress.
 */
export async function loadMessages(
  locale: AppLocale,
): Promise<AbstractIntlMessages> {
  if (locale === DEFAULT_LOCALE) return hrMessages as AbstractIntlMessages;

  const localeMessages = (await import(`./messages/${locale}/index.ts`))
    .default as Record<string, unknown>;

  return mergeOver(hrMessages, localeMessages) as AbstractIntlMessages;
}
