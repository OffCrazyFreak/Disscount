import type { ProductResponse } from "@/lib/cijene-api/schemas";
import { normalizeForSearch } from "@/utils/strings";

export interface IProductFilterOptions {
  categories: string[];
  brands: string[];
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
 * Build the selectable category/brand option lists from the current
 * search results, sorted for Croatian locale.
 */
export function deriveFilterOptions(
  products: ProductResponse[]
): IProductFilterOptions {
  const categories = new Map<string, string>();
  const brands = new Map<string, string>();

  for (const product of products) {
    for (const category of getProductCategories(product)) {
      addNormalized(categories, category);
    }
    for (const brand of getProductBrands(product)) {
      addNormalized(brands, brand);
    }
  }

  const sortHr = (a: string, b: string) =>
    a.localeCompare(b, "hr", { sensitivity: "base" });

  return {
    categories: [...categories.values()].sort(sortHr),
    brands: [...brands.values()].sort(sortHr),
  };
}

/**
 * Client-side visibility predicate for the category/brand filters.
 * Empty selections pass; otherwise the product must match ANY selected
 * category (on any of its chain entries) AND ANY selected brand.
 */
export function productMatchesFilters(
  product: ProductResponse,
  selectedCategories: string[],
  selectedBrands: string[]
): boolean {
  if (selectedCategories.length > 0) {
    const productCategories = new Set(
      getProductCategories(product).map(normalizeForSearch)
    );
    const matchesCategory = selectedCategories.some((category) =>
      productCategories.has(normalizeForSearch(category))
    );

    if (!matchesCategory) return false;
  }

  if (selectedBrands.length > 0) {
    const productBrands = new Set(
      getProductBrands(product).map(normalizeForSearch)
    );
    const matchesBrand = selectedBrands.some((brand) =>
      productBrands.has(normalizeForSearch(brand))
    );

    if (!matchesBrand) return false;
  }

  return true;
}
