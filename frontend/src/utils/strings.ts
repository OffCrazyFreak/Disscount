// Utility helpers used across the app

import { parseServerDate } from "@/utils/date";

/**
 * Normalize strings for search: remove diacritics and apply language-specific replacements.
 * Works well for Croatian and German diacritics.
 */
export function normalizeForSearch(s: string) {
  if (!s) return "";
  try {
    return (
      s
        .normalize("NFD")
        // remove any unicode diacritic combining marks
        .replace(/\p{Diacritic}/gu, "")
        .replace(/[\u0300-\u036f]/g, "")
        // language-specific normalizations
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .replace(/ß/g, "ss")
        .replace(/Ä/g, "A")
        .replace(/ä/g, "a")
        .replace(/Ö/g, "O")
        .replace(/ö/g, "o")
        .replace(/Ü/g, "U")
        .replace(/ü/g, "u")
        .toLowerCase()
    );
  } catch {
    // Fallback: strip common diacritics via combining marks removal
    return s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }
}

/**
 * Format an ISO date string (or any parsable date) to DD.MM.YYYY.
 * Falls back to the original input when the date is invalid.
 */
export function formatDate(dateString?: string | null) {
  if (!dateString) return "";
  try {
    const d = parseServerDate(dateString);
    if (Number.isNaN(d.getTime())) return dateString;

    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();

    return `${day}.${month}.${year}.`;
  } catch {
    return String(dateString);
  }
}

/**
 * Format an ISO date string to DD.MM.YYYY. HH:MM.
 * Falls back to the original input when the date is invalid.
 */
export function formatDateTime(dateString?: string | null) {
  if (!dateString) return "";

  const d = parseServerDate(dateString);
  if (Number.isNaN(d.getTime())) return dateString;

  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");

  return `${formatDate(dateString)} ${hours}:${minutes}`;
}

/**
 * Convert a string to PascalCase.
 */
export function toPascalCase(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
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
 * Pluralize a Croatian noun. The language has three forms, not two: 1 stavka,
 * 2 to 4 stavke, 5 and up stavki, with 11 to 14 taking the last form despite
 * ending in 1 to 4.
 *
 * `many` defaults to `one` because for many feminine nouns the genitive plural
 * happens to match the nominative singular (1 cijena, 5 cijena). That is a
 * coincidence of those words, not a rule, so pass the third form explicitly for
 * anything where it differs.
 *
 * @param n the count
 * @param one form for 1, 21, 31 (e.g. "stavka")
 * @param few form for 2 to 4, 22 to 24 (e.g. "stavke")
 * @param many form for 0 and 5 and up (e.g. "stavki")
 */
export function pluralizeCroatian(
  n: number,
  one: string,
  few: string,
  many: string = one,
): string {
  const last = n % 10;
  const lastTwo = n % 100;

  if (lastTwo >= 11 && lastTwo <= 14) return many;
  if (last === 1) return one;
  if (last >= 2 && last <= 4) return few;

  return many;
}

/**
 * Compare two strings for display order in Croatian, where Č, Ć, Đ, Š and Ž
 * have their own places in the alphabet rather than collating next to C, D,
 * S and Z. Use this for every user-facing sort so lists agree with each other.
 */
export function compareHr(a: string, b: string): number {
  return a.localeCompare(b, "hr", { sensitivity: "base" });
}
