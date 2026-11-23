import { getTranslations } from "next-intl/server";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { paginationPages } from "@/app/[locale]/categories/utils/category-page";
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

  return (
    <nav
      aria-label={t("pagination.label")}
      className="flex flex-wrap items-center justify-between gap-2"
    >
      {page > 1 ? (
        <Link
          href={categoryPath(slug, page - 1)}
          rel="prev"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <ChevronLeft aria-hidden="true" />
          {t("pagination.previous")}
        </Link>
      ) : (
        <span />
      )}

      <ol className="flex flex-wrap items-center justify-center gap-1">
        {paginationPages(page, totalPages).map((item, index) =>
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

      {page < totalPages ? (
        <Link
          href={categoryPath(slug, page + 1)}
          rel="next"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          {t("pagination.next")}
          <ChevronRight aria-hidden="true" />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
