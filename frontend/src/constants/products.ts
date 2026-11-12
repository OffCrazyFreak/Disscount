// Upstream caps at 100 with no paging or facet aggregation, so facet counts cover at most the first 100 matches (#93).
export const PRODUCT_SEARCH_LIMIT = 100;

// Upstream's own default for GET /v1/products when `limit` is omitted.
export const UPSTREAM_DEFAULT_SEARCH_LIMIT = 20;
