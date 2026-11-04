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

/** Normalized once so matchers and counters compare sets rather than re-normalizing per product. */
export interface IFacetQuery {
  indexed: IIndexedProduct[];
  locations: ILocationChains[];
  selectedChains: Set<string>;
  selectedCategories: Set<string>;
  selectedBrands: Set<string>;
  /** Chain codes across the selected cities; null when no city is selected */
  selectedLocationChains: Set<string> | null;
}
