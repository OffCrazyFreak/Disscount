import type { ProductResponse } from "@/lib/cijene-api/schemas";
import { normalizeForSearch } from "@/utils/strings";

/** How well the whole query sits in the text, best tier first. */
const MATCH_TIER = {
  exact: 0,
  prefix: 1,
  wordPrefix: 2,
  contains: 3,
  none: 4,
};

const NO_POSITION = Number.MAX_SAFE_INTEGER;

interface IProductRelevance {
  product: ProductResponse;
  matchedTokens: number;
  tier: number;
  position: number;
  chainCount: number;
  nameLength: number;
}

function findWholeQuery(haystack: string, query: string) {
  if (haystack === query) return { tier: MATCH_TIER.exact, position: 0 };

  const position = haystack.indexOf(query);
  if (position === -1) return { tier: MATCH_TIER.none, position: NO_POSITION };
  if (position === 0) return { tier: MATCH_TIER.prefix, position };

  const startsWord = /[^a-z0-9]/.test(haystack[position - 1]);
  return {
    tier: startsWord ? MATCH_TIER.wordPrefix : MATCH_TIER.contains,
    position,
  };
}

function findBestWholeQuery(name: string, brand: string, query: string) {
  const nameMatch = findWholeQuery(name, query);
  const brandMatch = findWholeQuery(brand, query);

  return nameMatch.tier <= brandMatch.tier ? nameMatch : brandMatch;
}

function rate(
  product: ProductResponse,
  query: string,
  tokens: string[],
): IProductRelevance {
  const name = normalizeForSearch(product.name ?? "");
  const brand = normalizeForSearch(product.brand ?? "");

  return {
    product,
    matchedTokens: tokens.filter(
      (token) => name.includes(token) || brand.includes(token),
    ).length,
    ...findBestWholeQuery(name, brand, query),
    chainCount: product.chains.length,
    nameLength: (product.name ?? "").length,
  };
}

/**
 * Tie-breaking comparison in priority order, the way a search engine ranks:
 * text relevance first, then how widely stocked the product is, then the
 * shorter name, which is usually the plain product rather than a bundle.
 */
function compareRelevance(a: IProductRelevance, b: IProductRelevance): number {
  return (
    b.matchedTokens - a.matchedTokens ||
    a.tier - b.tier ||
    a.position - b.position ||
    b.chainCount - a.chainCount ||
    a.nameLength - b.nameLength
  );
}

/** Orders search hits by relevance to the query, leaving them untouched without one. */
export default function sortProductsByRelevance(
  products: ProductResponse[],
  query: string,
): ProductResponse[] {
  const normalizedQuery = normalizeForSearch(query).trim();
  if (!normalizedQuery) return products;

  const tokens = normalizedQuery.split(/\s+/);

  return products
    .map((product) => rate(product, normalizedQuery, tokens))
    .sort(compareRelevance)
    .map((rated) => rated.product);
}
