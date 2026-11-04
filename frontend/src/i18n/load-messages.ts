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

/** Falls back to Croatian rather than the raw key; scripts/check-i18n.mjs keeps catalogs in step, so this only matters mid-translation. */
export async function loadMessages(
  locale: AppLocale,
): Promise<AbstractIntlMessages> {
  if (locale === DEFAULT_LOCALE) return hrMessages as AbstractIntlMessages;

  const localeMessages = (await import(`./messages/${locale}/index.ts`))
    .default as Record<string, unknown>;

  return mergeOver(hrMessages, localeMessages) as AbstractIntlMessages;
}
