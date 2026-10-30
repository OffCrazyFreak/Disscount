import { cn } from "@/lib/utils";
import { formatLocale } from "@/i18n/formatting";

const priceFormatters = new Map<string, Intl.NumberFormat>();

function priceFormatter(locale: string, signed: boolean) {
  const key = `${locale}:${signed}`;
  let formatter = priceFormatters.get(key);

  if (!formatter) {
    formatter = new Intl.NumberFormat(formatLocale(locale), {
      style: "currency",
      currency: "EUR",
      signDisplay: signed ? "exceptZero" : "auto",
    });
    priceFormatters.set(key, formatter);
  }

  return formatter;
}

// "1,99 €" in Croatian, "€1.99" in English: symbol position and separators are the
// locale's, the currency is always EUR.
export function formatPrice(value: number, locale: string): string {
  return priceFormatter(locale, false).format(value);
}

export function formatPriceDelta(
  difference: number,
  percentage: number,
  locale: string,
): string {
  return `${priceFormatter(locale, true).format(difference)} (${Math.round(Math.abs(percentage))}%)`;
}

export function priceDeltaColorClass(difference: number | null): string {
  return cn({
    "text-red-700": (difference ?? 0) > 0,
    "text-green-700": (difference ?? 0) < 0,
    "text-gray-700": (difference ?? 0) === 0,
  });
}
