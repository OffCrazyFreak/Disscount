// Every first path segment Spring serves under /api. Anything else is refused before a fetch,
// so the proxy can never be pointed at another service.
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

/** The Spring URL for a proxied path, or null when the path is not one of Spring's. */
export function backendUrl(
  segments: string[],
  search: string,
  backendOrigin: string,
): URL | null {
  if (!BACKEND_ROOTS.has(segments[0]) || !segments.every(isSafeSegment)) {
    return null;
  }

  const path = segments.map(encodeURIComponent).join("/");
  const url = new URL(`/api/${path}${search}`, backendOrigin);
  return url.origin === new URL(backendOrigin).origin ? url : null;
}
