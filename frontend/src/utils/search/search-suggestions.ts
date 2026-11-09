import { scoreFields } from "@/utils/search/match";
import { normalizeCached, prepareQuery } from "@/utils/search/normalize";

export interface ISearchSuggestion {
  text: string;
  kind: "recent" | "product";
}

export const MAX_SEARCH_SUGGESTIONS = 8;

/** A recent search wins a tie; text the field already holds is left out, since picking it adds nothing. */
export function rankSearchSuggestions(
  query: string,
  recent: string[],
  productNames: string[],
): ISearchSuggestion[] {
  const prepared = prepareQuery(query);
  if (!prepared) return [];

  const candidates: ISearchSuggestion[] = [
    ...recent.map((text) => ({ text, kind: "recent" as const })),
    ...productNames.map((text) => ({ text, kind: "product" as const })),
  ];
  const seen = new Set([prepared.normalized]);
  const scored: { suggestion: ISearchSuggestion; score: number }[] = [];

  for (const suggestion of candidates) {
    const normalized = normalizeCached(suggestion.text);
    if (seen.has(normalized)) continue;
    seen.add(normalized);

    const score = scoreFields([suggestion.text], prepared);
    if (score > 0) scored.push({ suggestion, score });
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_SEARCH_SUGGESTIONS)
    .map(({ suggestion }) => suggestion);
}
