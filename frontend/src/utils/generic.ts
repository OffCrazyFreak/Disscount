import { scoreFields } from "@/utils/search/match";
import { prepareQuery } from "@/utils/search/normalize";

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
 * Generic field-based filter helper, ordered best match first.
 *
 * Runs the app's one matcher, so a list page ranks the same way a dropdown
 * does: diacritic-blind, every word has to land somewhere, and an abbreviation
 * still finds its target.
 *
 * Example: filterByFields(products, q, ["name", "brand", "category"])
 */
export function filterByFields<T extends Record<string, unknown>>(
  items: T[],
  query: string | null,
  fields: Array<keyof T>,
): T[] {
  const prepared = prepareQuery(query ?? "");
  if (!prepared) return items;

  return items
    .map((item) => ({
      item,
      score: scoreFields(
        fields.map((field) => {
          const raw = item[field];
          return raw == null ? "" : String(raw);
        }),
        prepared,
      ),
    }))
    .filter((rated) => rated.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((rated) => rated.item);
}

/** Constrain a number to the inclusive [min, max] range. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
