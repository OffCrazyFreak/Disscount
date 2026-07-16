import { normalizeForSearch } from "@/utils/strings";

/**
 * Parse a comma-separated URL query param into a deduped list of values.
 *
 * Example: parseListParam("konzum, lidl,konzum") -> ["konzum", "lidl"]
 */
export function parseListParam(value: string | null): string[] {
  if (!value) return [];

  return [
    ...new Set(
      value
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean)
    ),
  ];
}

/**
 * Generic field-based filter helper.
 *
 * Example: filterByFields(products, q, ["name", "brand", "category"])
 */
export function filterByFields<T extends Record<string, unknown>>(
  items: T[],
  query: string | null,
  fields: Array<keyof T>
): T[] {
  const q = (query || "").trim();
  if (!q) return items;

  const qNorm = normalizeForSearch(q);

  return items.filter((item) => {
    for (const field of fields) {
      const raw = item[field];
      if (raw == null) continue;

      const value = normalizeForSearch(String(raw));

      // normalized match (case-insensitive + diacritic-insensitive)
      if (value.includes(qNorm)) return true;
    }

    return false;
  });
}
