import type { Metadata } from "next";

import { DEFAULT_LOCALE, type AppLocale } from "@/i18n/locales";
import { clientEnv } from "@/lib/env";
import { isIndexableOrigin } from "@/utils/indexing";

const PAGE_NUMBER = /^[1-9]\d{0,5}$/;

/** No param is page 1; anything but a plain positive number is a page that does not exist. */
export function parsePageParam(
  value: string | string[] | undefined,
): number | null {
  if (value === undefined) return 1;
  if (typeof value !== "string" || !PAGE_NUMBER.test(value)) return null;

  return Number(value);
}

/** An empty category still has its first page, so the hub never 404s between imports. */
export function isPageInRange(page: number, totalPages: number): boolean {
  return page === 1 || page <= totalPages;
}

const PAGE_GUARD_MIN_SLACK = 2;
const PAGE_GUARD_SLACK_SHARE = 0.1;

/** The highest page worth asking the backend about, with room for counts that lag an import. */
export function pageGuard(knownPages: number): number {
  const slack = Math.max(
    PAGE_GUARD_MIN_SLACK,
    Math.ceil(knownPages * PAGE_GUARD_SLACK_SHARE),
  );

  return knownPages + slack;
}

/** Only Croatian, as with product pages, and never an empty hub, which is thin content until an import fills it. */
export function isHubIndexable(
  locale: AppLocale,
  category?: { indexable: boolean; productCount: number },
): boolean {
  if (locale !== DEFAULT_LOCALE) return false;
  if (!category) return true;

  return category.indexable && category.productCount > 0;
}

/** Following stays on, so a hub kept out of the index still leads crawlers to its products. */
export function hubRobots(indexable: boolean): Pick<Metadata, "robots"> {
  if (indexable) return {};

  return {
    robots: {
      index: false,
      follow: isIndexableOrigin(clientEnv.NEXT_PUBLIC_APP_URL),
    },
  };
}

/** Pages shown on each side of the current one; a phone fits only the compact row beside the arrows. */
export const PAGE_WINDOW = { compact: 1, wide: 2 } as const;

/** First, last and the pages near the current one, with a gap wherever numbers are skipped. */
export function paginationPages(
  page: number,
  totalPages: number,
  window: number = PAGE_WINDOW.wide,
): (number | "gap")[] {
  const pages: (number | "gap")[] = [];

  for (let candidate = 1; candidate <= totalPages; candidate++) {
    const isEdge = candidate === 1 || candidate === totalPages;
    const isNear = Math.abs(candidate - page) <= window;

    if (isEdge || isNear) {
      pages.push(candidate);
    } else if (pages.at(-1) !== "gap") {
      pages.push("gap");
    }
  }

  return pages;
}
