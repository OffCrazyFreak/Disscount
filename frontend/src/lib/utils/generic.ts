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
import { normalizeForSearch } from "./strings";

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
