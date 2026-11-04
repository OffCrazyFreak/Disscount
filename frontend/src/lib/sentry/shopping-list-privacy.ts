import type { Breadcrumb } from "@sentry/nextjs";

import { scrubSensitiveData } from "@/lib/sentry/scrub-sensitive-data";

const SHOPPING_LIST_PATH = /^(\/[a-z]{2})?\/shopping-lists(\/|$)/;

export function isShoppingListPath(pathname: string): boolean {
  return SHOPPING_LIST_PATH.test(pathname);
}

/** Breadcrumbs quote the target's aria-label and list controls name their item, so on list pages they would carry a shared list's contents. */
export function scrubBreadcrumbOnPage(
  breadcrumb: Breadcrumb,
  pathname: string,
): Breadcrumb | null {
  if (breadcrumb.category?.startsWith("ui.") && isShoppingListPath(pathname)) {
    return null;
  }

  return scrubSensitiveData(breadcrumb);
}
