// Facets and the infinite list request this same limit to share one cache entry.
// The upstream cijene-api /v1/products endpoint caps at 100 and offers no paging,
// total count, or facet aggregation, so facet counts cover at most the first 100
// matches (issue #93). Going beyond that needs upstream search-layer support.
export const PRODUCT_SEARCH_LIMIT = 100;
