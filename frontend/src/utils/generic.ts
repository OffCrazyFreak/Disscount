import { scoreFields } from "@/utils/search/match";
import { prepareQuery } from "@/utils/search/normalize";

/** Keeps the first entry when a param is repeated; Next decodes these first. */
export function readSearchParam(
  searchParams: Record<string, string | string[] | undefined>,
  key = "q",
): string {
  const value = searchParams[key];

  return (Array.isArray(value) ? value[0] : value) || "";
}

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

/** `legacyCsv` also splits comma-joined old links; pass it only where a value can never contain a comma. */
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

export interface IRankedItem<T> {
  item: T;
  /** 0 when there is no query, so it never disturbs a caller's own ordering. */
  score: number;
}

/** Scores are coarse, a tier ladder, so equally good matches tie and a caller's own tie-breakers still decide. */
export function rankByFields<T extends Record<string, unknown>>(
  items: T[],
  query: string | null,
  fields: Array<keyof T>,
): Array<IRankedItem<T>> {
  const prepared = prepareQuery(query ?? "");
  if (!prepared) return items.map((item) => ({ item, score: 0 }));

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
    .filter((rated) => rated.score > 0);
}

/** A stable sort with coarse scores, so the caller's order survives among equal matches. */
export function filterByFields<T extends Record<string, unknown>>(
  items: T[],
  query: string | null,
  fields: Array<keyof T>,
): T[] {
  if (!prepareQuery(query ?? "")) return items;

  return rankByFields(items, query, fields)
    .sort((a, b) => b.score - a.score)
    .map((rated) => rated.item);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
