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
  if (q && q.includes(".")) {
    let trimmed = q.replace(/0+$/g, "");
    if (trimmed.endsWith(".")) trimmed = trimmed.slice(0, -1);
    return trimmed;
  }
  return q ?? "";
}
