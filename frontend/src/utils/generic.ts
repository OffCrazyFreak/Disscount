import { normalizeForSearch } from "@/utils/strings";

/**
 * Read one value out of a page's resolved searchParams, keeping the first
 * entry when a param is repeated. Next decodes these before handing them over.
 *
 * Example: readSearchParam({ q: ["mlijeko", "kruh"] }) -> "mlijeko"
 */
export function readSearchParam(
  searchParams: Record<string, string | string[] | undefined>,
  key = "q",
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
  params: Record<string, string | number | boolean | undefined>,
): string {
  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.set(key, String(value));
    }
  });

  return queryParams.toString();
}

/** Structural shape of both URLSearchParams and Next's read-only version */
interface IReadableParams {
  getAll(name: string): string[];
}

function dedupeTrimmed(values: string[]): string[] {
  return [...new Set(values.map((entry) => entry.trim()).filter(Boolean))];
}

/**
 * Read a repeated URL query param into a deduped list of values.
 *
 * Example: readListParam(params, "brand") on "?brand=Zvijezda&brand=Vindija"
 *          -> ["Zvijezda", "Vindija"]
 *
 * `legacyCsv` also splits a comma-joined value, so links shared before the app
 * repeated its params keep working. Pass it only for a controlled vocabulary
 * such as chain codes, where a single value can never itself contain a comma.
 */
export function readListParam(
  params: IReadableParams,
  key: string,
  { legacyCsv = false } = {},
): string[] {
  const values = params.getAll(key);

  return dedupeTrimmed(
    legacyCsv ? values.flatMap((value) => value.split(",")) : values,
  );
}

/**
 * Generic field-based filter helper.
 *
 * Example: filterByFields(products, q, ["name", "brand", "category"])
 */
export function filterByFields<T extends Record<string, unknown>>(
  items: T[],
  query: string | null,
  fields: Array<keyof T>,
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
