import { formatLocale } from "@/i18n/formatting";

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
