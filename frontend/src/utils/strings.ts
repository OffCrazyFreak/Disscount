import { parseServerDate } from "@/utils/date";
import { formatLocale, TIME_ZONE } from "@/i18n/formatting";

/**
 * Normalize strings for search: remove diacritics and apply language-specific replacements.
 * Works well for Croatian and German diacritics.
 */
export function normalizeForSearch(s: string) {
  if (!s) return "";
  return (
    s
      .normalize("NFD")
      // Not redundant: each strip removes marks the other misses (^ and ` versus U+0363 to U+036F).
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[\u0300-\u036f]/g, "")
      // đ, Đ and ß have no NFD decomposition, so the strips above leave them.
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .replace(/ß/g, "ss")
      .toLowerCase()
  );
}

const dateFormatters = new Map<string, Intl.DateTimeFormat>();

function dateFormatter(locale: string, withTime: boolean) {
  const key = `${locale}:${withTime}`;
  let formatter = dateFormatters.get(key);

  if (!formatter) {
    // 12/10/2026 means two different days to British and American readers, so
    // English spells the month out (12 Oct 2026); the others read numerals one way.
    const spelledMonth = locale === "en";
    formatter = new Intl.DateTimeFormat(formatLocale(locale), {
      day: spelledMonth ? "numeric" : "2-digit",
      month: spelledMonth ? "short" : "2-digit",
      year: "numeric",
      ...(withTime && { hour: "2-digit", minute: "2-digit" }),
      timeZone: TIME_ZONE,
    });
    dateFormatters.set(key, formatter);
  }

  return formatter;
}

function formatServerDate(
  dateString: string | null | undefined,
  locale: string,
  withTime: boolean,
) {
  if (!dateString) return "";

  const d = parseServerDate(dateString);
  if (Number.isNaN(d.getTime())) return dateString;

  return dateFormatter(locale, withTime).format(d);
}

/**
 * Format an ISO date string (or any parsable date) as a date in the locale's style,
 * in Croatian time. Falls back to the original input when the date is invalid.
 */
export function formatDate(
  dateString: string | null | undefined,
  locale: string,
) {
  return formatServerDate(dateString, locale, false);
}

/** Same as formatDate, with hours and minutes. */
export function formatDateTime(
  dateString: string | null | undefined,
  locale: string,
) {
  return formatServerDate(dateString, locale, true);
}

/**
 * Same as formatDate, but Croatian drops the leading zeros its orthography
 * never writes (3. 11. 2026.), which the CLDR data pads to 03. 11. 2026.
 */
export function formatPlainDate(
  dateString: string | null | undefined,
  locale: string,
) {
  const formatted = formatDate(dateString, locale);

  return locale === "hr" ? formatted.replace(/\b0(\d)/g, "$1") : formatted;
}

/**
 * Trim trailing zeros from decimal quantities: "1.000" -> "1", "1.200" -> "1.2"
 */
export function formatQuantity(q?: string | null): string | null {
  if (q == null) return null;
  if (q.includes(".")) {
    let trimmed = q.replace(/0+$/g, "");
    if (trimmed.endsWith(".")) trimmed = trimmed.slice(0, -1);
    return trimmed;
  }
  return q;
}

/**
 * Compare two strings for display order in Croatian, where Č, Ć, Đ, Š and Ž
 * have their own places in the alphabet rather than collating next to C, D,
 * S and Z. Use this for every user-facing sort so lists agree with each other.
 */
export function compareHr(a: string, b: string): number {
  return a.localeCompare(b, "hr", { sensitivity: "base" });
}
