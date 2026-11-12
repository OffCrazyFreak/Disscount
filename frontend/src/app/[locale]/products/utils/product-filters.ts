import type { ProductResponse } from "@/lib/cijene-api/schemas";
import { normalizeForSearch } from "@/utils/strings";

/** No diacritic stripping as in `normalizeForSearch`, which could collide two distinct codes. */
export function normalizeChainCode(code: string): string {
  return code.trim().toLowerCase();
}

/** Selected values may come from a hand-edited URL, with wrong casing or stray spaces. */
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

export function getProductCategories(product: ProductResponse): string[] {
  const categories = new Map<string, string>();

  for (const chainProduct of product.chains) {
    addNormalized(categories, chainProduct.category);
  }

  return [...categories.values()];
}

export function getProductBrands(product: ProductResponse): string[] {
  const brands = new Map<string, string>();

  addNormalized(brands, product.brand);
  for (const chainProduct of product.chains) {
    addNormalized(brands, chainProduct.brand);
  }

  return [...brands.values()];
}

/** `allowedChains`: null means unfiltered and empty means no overlap. */
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

interface ISelectedFilters {
  selectedChains: string[];
  selectedLocations: string[];
  selectedCategories: string[];
  selectedBrands: string[];
  isPriceDataPartial: boolean;
}

/** An empty page should mean those places price none, so this tests dropping only the location filter. */
export function hasMatchOutsideLocations(
  products: ProductResponse[],
  {
    selectedChains,
    selectedLocations,
    selectedCategories,
    selectedBrands,
    isPriceDataPartial,
  }: ISelectedFilters,
): boolean {
  // A city that failed to answer may price these products, so only a complete answer proves none do
  if (selectedLocations.length === 0 || isPriceDataPartial) return false;

  const allowedChains = selectedChains.length > 0 ? selectedChains : null;

  return products.some((product) =>
    productMatchesFilters(
      product,
      allowedChains,
      selectedCategories,
      selectedBrands,
    ),
  );
}
