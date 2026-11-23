import type { Metadata, ResolvingMetadata } from "next";
import { withSharePreview } from "@/utils/seo/share-metadata";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import CategoryIntro from "@/app/[locale]/categories/components/category-intro";
import CategoryPagination from "@/app/[locale]/categories/components/category-pagination";
import CategoryProductList from "@/app/[locale]/categories/components/category-product-list";
import { categoryName } from "@/app/[locale]/categories/utils/category-names";
import {
  hubRobots,
  isHubIndexable,
  isPageInRange,
  pageGuard,
  parsePageParam,
} from "@/app/[locale]/categories/utils/category-page";
import { categoryPriceFacts } from "@/app/[locale]/categories/utils/category-price-facts";
import { livePricedProducts } from "@/app/[locale]/categories/utils/live-priced-products";
import PageBreadcrumbs from "@/components/custom/common/display/page-breadcrumbs";
import {
  CATEGORY_PAGE_SIZE,
  getCatalogCategories,
  getCategoryProducts,
} from "@/lib/api/catalog-categories/server";
import type { ProductResponse } from "@/lib/cijene-api/schemas";
import { getServerProduct } from "@/lib/cijene-api/server/get-product";
import {
  CATEGORIES_PATH,
  categoryPageUrl,
  categoryPath,
} from "@/utils/links/category-links";

type CategoryPageProps = PageProps<"/[locale]/categories/[slug]">;

/** Null for every URL that must 404: an unknown slug, a malformed page or one past the end. */
async function loadCategoryPage(props: CategoryPageProps) {
  const { slug } = await props.params;
  const page = parsePageParam((await props.searchParams).page);
  if (page === null) return null;

  const { categories } = await getCatalogCategories();
  const category = categories.find((candidate) => candidate.slug === slug);
  if (!category) return null;

  // Only absurd pages stop here; the counts can lag the listing after an import, so the backend decides the rest.
  const knownPages = Math.ceil(category.productCount / CATEGORY_PAGE_SIZE);
  if (!isPageInRange(page, pageGuard(knownPages))) return null;

  const listing = await getCategoryProducts(slug, page);
  if (!listing || !isPageInRange(page, listing.page.totalPages)) return null;

  return { category, page, listing };
}

export async function generateMetadata(
  props: CategoryPageProps,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const loaded = await loadCategoryPage(props);
  if (!loaded) return { robots: { index: false, follow: false } };

  const { category, page } = loaded;
  const locale = await getLocale();
  const t = await getTranslations("categories");
  const name = categoryName(t, category.slug);

  return withSharePreview(
    {
      title:
        page > 1
          ? t("meta.categoryPageTitle", { name, page })
          : t("meta.categoryTitle", { name }),
      description: t("meta.categoryDescription", {
        name,
        count: category.productCount,
      }),
      // No hreflang: only the Croatian hub can be indexed, and Google ignores a set whose other members are noindex.
      alternates: { canonical: categoryPageUrl(category.slug, locale, page) },
      ...hubRobots(isHubIndexable(locale, category)),
    },
    parent,
  );
}

export default async function CategoryPage(props: CategoryPageProps) {
  // No loading.tsx sits above this page, so the 404 status still holds.
  const loaded = await loadCategoryPage(props);
  if (!loaded) notFound();

  const { category, page, listing } = loaded;
  const locale = await getLocale();
  const t = await getTranslations("categories");
  const name = categoryName(t, category.slug);
  // Upstream prices cost quota, so only page 1 asks.
  const pricedProducts =
    page === 1
      ? await livePricedProducts(
          listing.items.map((item) => item.ean),
          getServerProduct,
        )
      : new Map<string, ProductResponse>();

  // A 500 is retried by crawlers, while a 200 full of unpriced products would be indexed as is.
  if (!pricedProducts) {
    throw new Error(`Prices for category ${category.slug} are unavailable`);
  }

  return (
    <div className="space-y-4">
      <PageBreadcrumbs
        label={t("breadcrumbs.label")}
        locale={locale}
        steps={[
          { label: t("breadcrumbs.home"), path: "/" },
          { label: t("breadcrumbs.categories"), path: CATEGORIES_PATH },
          { label: name, path: categoryPath(category.slug) },
        ]}
      />

      <h1 className="text-3xl font-bold text-pretty">{name}</h1>

      <CategoryIntro
        productCount={category.productCount}
        facts={categoryPriceFacts([...pricedProducts.values()])}
      />

      {listing.items.length > 0 ? (
        <CategoryProductList
          items={listing.items}
          pricedProducts={pricedProducts}
        />
      ) : (
        <p className="text-muted-foreground">{t("empty")}</p>
      )}

      <CategoryPagination
        slug={category.slug}
        page={page}
        totalPages={listing.page.totalPages}
      />
    </div>
  );
}
