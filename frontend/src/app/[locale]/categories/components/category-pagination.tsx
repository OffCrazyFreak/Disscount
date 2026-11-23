import { getTranslations } from "next-intl/server";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  PAGE_WINDOW,
  paginationPages,
} from "@/app/[locale]/categories/utils/category-page";
import { categoryPath } from "@/utils/category-links";

interface ICategoryPaginationProps {
  slug: string;
  page: number;
  totalPages: number;
}

/** Plain links, so crawlers without JavaScript reach every page of the hub. */
export default async function CategoryPagination({
  slug,
  page,
  totalPages,
}: ICategoryPaginationProps) {
  const t = await getTranslations("categories");

  if (totalPages <= 1) return null;

  // On a phone the arrows lose their words, so the row of numbers fits beside them on one line.
  const arrowClassName = cn(
    buttonVariants({ variant: "outline", size: "sm" }),
    "max-sm:size-9 max-sm:px-0",
  );

  function pageNumbers(isCompact: boolean) {
    const pageWindow = isCompact ? PAGE_WINDOW.compact : PAGE_WINDOW.wide;

    return (
      <ol
        className={cn(
          "items-center justify-center gap-1",
          isCompact ? "flex sm:hidden" : "hidden sm:flex sm:flex-wrap",
        )}
      >
        {paginationPages(page, totalPages, pageWindow).map((item, index) =>
          item === "gap" ? (
            <li
              key={`gap-${index}`}
              aria-hidden="true"
              className="px-1 text-sm text-muted-foreground"
            >
              …
            </li>
          ) : (
            <li key={item}>
              <Link
                href={categoryPath(slug, item)}
                aria-current={item === page ? "page" : undefined}
                aria-label={t("pagination.pageLabel", { page: item })}
                className={buttonVariants({
                  variant: item === page ? "primary" : "ghost",
                  size: "icon-sm",
                })}
              >
                {item}
              </Link>
            </li>
          ),
        )}
      </ol>
    );
  }

  return (
    <nav
      aria-label={t("pagination.label")}
      className="flex items-center justify-between gap-2"
    >
      {page > 1 ? (
        <Link
          href={categoryPath(slug, page - 1)}
          rel="prev"
          className={arrowClassName}
        >
          <ChevronLeft aria-hidden="true" />
          <span className="max-sm:sr-only">{t("pagination.previous")}</span>
        </Link>
      ) : (
        <span />
      )}

      {pageNumbers(true)}
      {pageNumbers(false)}

      {page < totalPages ? (
        <Link
          href={categoryPath(slug, page + 1)}
          rel="next"
          className={arrowClassName}
        >
          <span className="max-sm:sr-only">{t("pagination.next")}</span>
          <ChevronRight aria-hidden="true" />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
