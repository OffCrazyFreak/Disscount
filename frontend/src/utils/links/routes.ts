const PRODUCT_PAGE = /^\/products\/([^/]+)\/?$/;
const SHOPPING_LIST_PAGE = /^\/shopping-lists\/([^/]+)\/?$/;

function capturedSegment(pattern: RegExp, pathname: string): string | null {
  const match = pattern.exec(pathname);
  if (!match) return null;

  try {
    return decodeURIComponent(match[1]);
  } catch {
    // Malformed percent escapes throw, and these run in root-layout chrome.
    return null;
  }
}

/** Read from the path because the chrome that needs these is in the root layout, which has no dynamic segment. */
export function productEanFromPath(pathname: string): string | null {
  return capturedSegment(PRODUCT_PAGE, pathname);
}

export function shoppingListIdFromPath(pathname: string): string | null {
  return capturedSegment(SHOPPING_LIST_PAGE, pathname);
}

/** Boundary aware, so a future /watchlisting could never light /watchlist */
export function isRouteActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
