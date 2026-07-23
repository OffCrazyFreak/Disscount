import type { ProductResponse } from "@/lib/cijene-api/schemas";
import { normalizeForSearch } from "@/utils/strings";

export function normalizeChainCode(code: string): string {
  return code.trim().toLowerCase();
}

/**
 * Map selected values (possibly from a hand-edited URL: wrong casing,
 * stray spaces) onto their canonical option value when one matches.
 */
export function canonicalizeSelection(
  selected: string[],
  options: string[],
): string[] {
  if (selected.length === 0) return selected;

  const byNormalized = new Map(
    options.map((option) => [normalizeForSearch(option), option]),
  );

  return [
    ...new Set(
      selected.map((value) => {
        const trimmed = value.trim();
        return byNormalized.get(normalizeForSearch(trimmed)) ?? trimmed;
      }),
    ),
  ];
}

function addNormalized(map: Map<string, string>, value: string | null) {
  if (!value) return;

  const trimmed = value.trim();
  if (!trimmed) return;

  const key = normalizeForSearch(trimmed);
  if (!map.has(key)) map.set(key, trimmed);
}

/**
 * Distinct category values across a product's chain entries
 * (case/diacritic-insensitive dedupe, first-seen casing kept).
 */
export function getProductCategories(product: ProductResponse): string[] {
  const categories = new Map<string, string>();

  for (const chainProduct of product.chains) {
    addNormalized(categories, chainProduct.category);
  }

  return [...categories.values()];
}

/**
 * Distinct brand values for a product: the product-level brand,
 * with chain-entry brands as fallback data.
 */
export function getProductBrands(product: ProductResponse): string[] {
  const brands = new Map<string, string>();

  addNormalized(brands, product.brand);
  for (const chainProduct of product.chains) {
    addNormalized(brands, chainProduct.brand);
  }

  return [...brands.values()];
}

/**
 * Client-side visibility predicate for the active filters. `allowedChains`
 * is the resolved chain+location filter (null = unfiltered, empty = no
 * overlap); empty category/brand selections pass, otherwise the product
 * must match ANY selected value.
 */
export function productMatchesFilters(
  product: ProductResponse,
  allowedChains: string[] | null,
  selectedCategories: string[],
  selectedBrands: string[],
): boolean {
  if (allowedChains !== null) {
    const allowed = new Set(allowedChains.map(normalizeChainCode));
    const hasAllowedChain = product.chains.some((chainProduct) =>
      allowed.has(normalizeChainCode(chainProduct.chain)),
    );

    if (!hasAllowedChain) return false;
  }

  if (selectedCategories.length > 0) {
    const productCategories = new Set(
      getProductCategories(product).map(normalizeForSearch),
    );
    const matchesCategory = selectedCategories.some((category) =>
      productCategories.has(normalizeForSearch(category)),
    );

    if (!matchesCategory) return false;
  }

  if (selectedBrands.length > 0) {
    const productBrands = new Set(
      getProductBrands(product).map(normalizeForSearch),
    );
    const matchesBrand = selectedBrands.some((brand) =>
      productBrands.has(normalizeForSearch(brand)),
    );

    if (!matchesBrand) return false;
  }

  return true;
}
