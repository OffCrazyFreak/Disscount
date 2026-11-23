import { getTranslations } from "next-intl/server";

import { isHubIndexable } from "@/app/[locale]/categories/utils/category-page";
import { categoryName } from "@/app/[locale]/categories/utils/category-names";
import SimilarProducts from "@/app/[locale]/products/[id]/components/similar-products";
import { Link } from "@/i18n/navigation";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import {
  OPTIONAL_LOOKUP_TIMEOUT_MS,
  getCatalogCategories,
  getCategoryProducts,
} from "@/lib/api/catalog-categories/server";
import type { CatalogCategories, CategoryProduct } from "@/lib/api/types";
import { CATEGORIES_PATH, categoryPath } from "@/utils/category-links";

// Enough to give each hub a few links in without the list outgrowing the search above it.
const POPULAR_PER_CATEGORY = 2;

type NamedProduct = CategoryProduct & { name: string };

async function popularProducts(
  categories: CatalogCategories["categories"],
): Promise<NamedProduct[]> {
  const pages = await Promise.all(
    // One slow hub costs only its own links.
    categories.map((category) =>
      getCategoryProducts(category.slug, 1, OPTIONAL_LOOKUP_TIMEOUT_MS).catch(
        () => null,
      ),
    ),
  );

  return pages.flatMap((page) =>
    (page?.items ?? [])
      .filter((item): item is NamedProduct => Boolean(item.name))
      .slice(0, POPULAR_PER_CATEGORY),
  );
}

/** Null on a backend outage, because the search above must still render. */
async function loadLandingLinks() {
  try {
    const { categories } = await getCatalogCategories(
      OPTIONAL_LOOKUP_TIMEOUT_MS,
    );
    // The same hubs the sitemap lists, so links and sitemap agree on what to crawl.
    const hubs = categories.filter((category) =>
      isHubIndexable(DEFAULT_LOCALE, category),
    );

    return {
      categoryCount: categories.length,
      productCount: categories.reduce(
        (sum, category) => sum + category.productCount,
        0,
      ),
      hubs,
      popular: await popularProducts(hubs),
    };
  } catch (error) {
    console.warn("[products] landing links unavailable", error);

    return null;
  }
}

/** Server HTML under the browser-rendered search, so crawlers reach the hubs and products. */
export default async function ProductsLandingLinks() {
  const t = await getTranslations("products");
  const tCategories = await getTranslations("categories");
  const links = await loadLandingLinks();

  const allCategoriesLink = (
    <Link href={CATEGORIES_PATH} className="text-primary hover:underline">
      {t("browseCategories")}
    </Link>
  );

  if (!links) {
    return <p className="mt-6 text-center text-sm">{allCategoriesLink}</p>;
  }

  return (
    <div className="mt-8 space-y-6">
      <p className="text-muted-foreground text-pretty">
        {t("landing.intro", {
          products: links.productCount,
          categories: links.categoryCount,
        })}
      </p>

      <section aria-labelledby="landing-categories" className="space-y-3">
        <h2 id="landing-categories" className="text-lg font-semibold">
          {t("landing.categoriesHeading")}
        </h2>

        {links.hubs.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {links.hubs.map((hub) => (
              <li key={hub.slug}>
                <Link
                  href={categoryPath(hub.slug)}
                  className="inline-flex rounded-full border bg-card px-3 py-1.5 text-sm font-medium shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {categoryName(tCategories, hub.slug)}
                </Link>
              </li>
            ))}
          </ul>
        )}

        <p className="text-sm">{allCategoriesLink}</p>
      </section>

      {links.popular.length > 0 && (
        <SimilarProducts
          heading={t("landing.popularHeading")}
          products={links.popular}
        />
      )}
    </div>
  );
}
