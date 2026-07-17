import { normalizeForSearch } from "@/utils/strings";

/**
 * Read one value out of a page's resolved searchParams, keeping the first
 * entry when a param is repeated. Next decodes these before handing them over.
 *
 * Example: readSearchParam({ q: ["mlijeko", "kruh"] }) -> "mlijeko"
 */
export function readSearchParam(
  searchParams: Record<string, string | string[] | undefined>,
  key = "q"
): string {
  const value = searchParams[key];

  return (Array.isArray(value) ? value[0] : value) || "";
}

/**
 * Serialize params into a query string, dropping the ones left undefined.
 *
 * Example: buildQueryString({ q: "mlijeko", limit: 10, date: undefined })
 *          -> "q=mlijeko&limit=10"
 */
export function buildQueryString(
  params: Record<string, string | number | boolean | undefined>
): string {
  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.set(key, String(value));
    }
  });

  return queryParams.toString();
}

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
