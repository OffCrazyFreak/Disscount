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
