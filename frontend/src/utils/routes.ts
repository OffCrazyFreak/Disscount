const PRODUCT_PATH = /^\/products\/([^/]+)\/?$/;
const SHOPPING_LIST_PATH = /^\/shopping-lists\/([^/]+)\/?$/;

function readSegment(pathname: string, pattern: RegExp): string | null {
  const match = pathname.match(pattern);

  return match ? decodeURIComponent(match[1]) : null;
}

/** A layout-mounted component gets no route params, so it reads the pathname. */
export function productEanFromPathname(pathname: string): string | null {
  return readSegment(pathname, PRODUCT_PATH);
}

export function shoppingListIdFromPathname(pathname: string): string | null {
  const id = readSegment(pathname, SHOPPING_LIST_PATH);

  return id === "new" ? null : id;
}
