export interface IFacetOption {
  value: string;
  count: number;
}

export interface IProductFacets {
  chains: IFacetOption[];
  locations: IFacetOption[];
  categories: IFacetOption[];
  brands: IFacetOption[];
}

export interface IFacetSelections {
  chains: string[];
  locations: string[];
  categories: string[];
  brands: string[];
}

/** One product reduced to the sets the facet counters compare against */
export interface IIndexedProduct {
  chainCodes: Set<string>;
  /** normalized -> display */
  categories: Map<string, string>;
  brands: Map<string, string>;
}

export interface ILocationChains {
  name: string;
  chains: Set<string>;
}

/**
 * The products and selections of one facet computation, normalized once so the
 * matchers and counters can compare sets rather than re-normalize per product.
 */
export interface IFacetQuery {
  indexed: IIndexedProduct[];
  locations: ILocationChains[];
  selectedChains: Set<string>;
  selectedCategories: Set<string>;
  selectedBrands: Set<string>;
  /** Chain codes across the selected cities; null when no city is selected */
  selectedLocationChains: Set<string> | null;
}
