import type { ProductResponse } from "@/lib/cijene-api/schemas";
import { findWholeQuery } from "@/utils/search/match";
import { normalizeCached, prepareQuery } from "@/utils/search/normalize";
import {
  byAsc,
  byDesc,
  chainComparators,
  type Comparator,
} from "@/utils/search/rank";

interface IProductRelevance {
  product: ProductResponse;
  matchedTokens: number;
  tier: number;
  position: number;
  chainCount: number;
  nameLength: number;
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
  const name = normalizeCached(product.name ?? "");
  const brand = normalizeCached(product.brand ?? "");

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
 * Tie-breaking in priority order, the way a search engine ranks: text relevance
 * first, then how widely stocked the product is, then the shorter name, which is
 * usually the plain product rather than a bundle.
 */
const compareRelevance: Comparator<IProductRelevance> = chainComparators(
  byDesc((rated) => rated.matchedTokens),
  byAsc((rated) => rated.tier),
  byAsc((rated) => rated.position),
  byDesc((rated) => rated.chainCount),
  byAsc((rated) => rated.nameLength),
);

/** Orders search hits by relevance to the query, leaving them untouched without one. */
export default function sortProductsByRelevance(
  products: ProductResponse[],
  query: string,
): ProductResponse[] {
  const prepared = prepareQuery(query);
  if (!prepared) return products;

  return products
    .map((product) => rate(product, prepared.normalized, prepared.tokens))
    .sort(compareRelevance)
    .map((rated) => rated.product);
}
