// Utility helpers used across the app

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
  } catch (err) {
    // Fallback: strip common diacritics via combining marks removal
    return s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }
}
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generic field-based filter helper.
 *
 * Example: filterByFields(products, q, ["name", "brand", "category"])
 */
export function filterByFields<T extends Record<string, any>>(
  items: T[],
  query: string | null,
  fields: Array<keyof T>
): T[] {
  const q = (query || "").trim();
  if (!q) return items;

  const qLower = q.toLowerCase();
  const qNorm = normalizeForSearch(q);

  return items.filter((item) => {
    for (const field of fields) {
      const raw = item[field];
      if (raw == null) continue;

      const value = String(raw);

      // original, case-insensitive match
      if (value.toLowerCase().includes(qLower)) return true;

      // normalized, diacritic-insensitive match
      if (normalizeForSearch(value).includes(qNorm)) return true;
    }

    return false;
  });
}

/**
 * Format an ISO date string (or any parsable date) to DD.MM.YYYY.
 * Falls back to the original input when the date is invalid.
 */
export function formatDate(dateString?: string | null) {
  if (!dateString) return "";
  try {
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return dateString;

    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();

    return `${day}.${month}.${year}.`;
  } catch (err) {
    return String(dateString);
  }
}
