import { formatLocale } from "@/i18n/formatting";
import { formatDate } from "@/utils/strings";

// API dates arrive as YYYY-MM-DD, which parses as midnight UTC: the same day in Croatia.
export function formatCardDate(value: string, locale: string): string {
  return formatDate(value, locale);
}

/** A balance in a real currency. Points have no unit and are worded by the caller. */
export function formatCardMoney(
  balance: number,
  currency: string,
  locale: string,
): string {
  return new Intl.NumberFormat(formatLocale(locale), {
    style: "currency",
    currency,
  }).format(balance);
}
