// Upstream caps at 100 with no paging or facet aggregation, so facet counts cover at most the first 100 matches (#93).
export const PRODUCT_SEARCH_LIMIT = 100;

// Upstream's own default for GET /v1/products when `limit` is omitted.
export const UPSTREAM_DEFAULT_SEARCH_LIMIT = 20;

// Counted in visible characters; typing alone waits for more, because two letters match a large share of the catalogue.
export const PRODUCT_QUERY_MIN_LENGTH = { submitted: 2, typed: 3 } as const;
