const PRODUCT_PAGE = /^\/products\/([^/]+)\/?$/;
const SHOPPING_LIST_PAGE = /^\/shopping-lists\/([^/]+)\/?$/;

function firstSegment(pattern: RegExp, pathname: string): string | null {
  const match = pattern.exec(pathname);

  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Read from the path rather than route params, because the chrome that needs
 * these is mounted in the root layout, which has no dynamic segment of its own.
 */
export function productEanFromPath(pathname: string): string | null {
  return firstSegment(PRODUCT_PAGE, pathname);
}

export function shoppingListIdFromPath(pathname: string): string | null {
  return firstSegment(SHOPPING_LIST_PAGE, pathname);
}
