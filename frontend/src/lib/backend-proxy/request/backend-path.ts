// Anything else is refused before a fetch, so the proxy can never be pointed at another service.
export const BACKEND_ROOTS = new Set([
  "admin",
  "contact",
  "digital-cards",
  "favorite-stores",
  "pinned-places",
  "pinned-stores",
  "products",
  "shopping-lists",
  "store-names",
  "users",
  "watchlist",
]);

// Next hands the route decoded segments, so an encoded slash or dot segment shows up here.
function isSafeSegment(segment: string) {
  return (
    segment !== "" &&
    segment !== "." &&
    segment !== ".." &&
    !segment.includes("/") &&
    !segment.includes("\\")
  );
}

export function backendUrl(
  segments: string[],
  search: string,
  backendOrigin: string,
): URL | null {
  if (!BACKEND_ROOTS.has(segments[0]) || !segments.every(isSafeSegment)) {
    return null;
  }

  return apiUrl(segments, search, backendOrigin);
}

function apiUrl(segments: string[], search: string, backendOrigin: string) {
  const path = segments.map(encodeURIComponent).join("/");
  const url = new URL(`/api/${path}${search}`, backendOrigin);
  return url.origin === new URL(backendOrigin).origin ? url : null;
}

const DOCS_PREFIXES = [["v3", "api-docs"], ["swagger-ui"]];

function startsWithDocsPrefix(segments: string[]) {
  return DOCS_PREFIXES.some((prefix) =>
    prefix.every((segment, index) => segments[index] === segment),
  );
}

/** Only springdoc's description and Swagger UI files, so the open docs route can reach nothing else. */
export function docsUrl(
  segments: string[],
  search: string,
  backendOrigin: string,
): URL | null {
  if (!startsWithDocsPrefix(segments) || !segments.every(isSafeSegment)) {
    return null;
  }

  return apiUrl(segments, search, backendOrigin);
}
