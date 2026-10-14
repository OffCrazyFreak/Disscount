"use client";

import { usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { TriangleAlert } from "lucide-react";
import { useViewMode } from "@/hooks/use-view-mode";
import useInfiniteProducts from "@/app/[locale]/products/hooks/use-infinite-products";
import useProductFilters from "@/app/[locale]/products/hooks/use-product-filters";
import ProductFiltersBar from "@/app/[locale]/products/components/product-filters-bar";
import ProductsResults from "@/app/[locale]/products/components/products-results";
import { Suspense } from "react";
import SearchBar from "@/components/custom/search/search-bar";
import SearchBarSkeleton from "@/components/custom/search/search-bar-skeleton";
import { Banner } from "@/components/custom/common/banner";

interface IProductsClientProps {
  query: string;
}

export default function ProductsClient({ query }: IProductsClientProps) {
  const t = useTranslations("products");
  const pathname = usePathname();
  // TODO(#61): take the setter here once ViewSwitcher is unparked below; until then
  // the mode is read-only and always the default.
  const [viewMode] = useViewMode(pathname);

  const filters = useProductFilters();
  const {
    selectedCategories,
    selectedBrands,
    selectedLocations,
    selectedSourceCities,
    allowedChains,
    locationsReady,
    locationsError,
    activeFilterCount,
    clearFilters,
  } = filters;

  const {
    visibleItems,
    total,
    isTruncated,
    isLoading,
    error,
    hasPartialPriceData,
  } = useInfiniteProducts(query, {
    allowedChains,
    selectedCategories,
    selectedBrands,
    selectedLocations,
    selectedSourceCities,
  });

  // A location filter is set but the city -> chains mapping is still loading
  const waitingForLocations = Boolean(query) && !locationsReady;
  const isPending = isLoading || waitingForLocations;
  const pageError = error || locationsError;
  const showPartialPricesBanner =
    hasPartialPriceData && !isPending && !pageError;

  return (
    <div className="space-y-4">
      <Suspense fallback={<SearchBarSkeleton />}>
        <SearchBar
          placeholder={t("list.searchPlaceholder")}
          searchRoute={pathname}
          clearable={true}
          allowScanning={true}
        />
      </Suspense>

      <ProductFiltersBar filters={filters} query={query} />

      <div className="flex items-center justify-between gap-4">
        <h3>
          {query.length > 0 &&
            (isPending
              ? t("list.resultsTitle", { query })
              : t("list.resultsTitleWithCount", {
                  query,
                  count: total,
                  suffix: isTruncated ? "+" : "",
                }))}
        </h3>

        {/* TODO: re-enable with personalisable list views (see view-switcher.tsx) */}
        {/* <ViewSwitcher viewMode={viewMode} setViewMode={setViewMode} /> */}
      </div>

      {showPartialPricesBanner && (
        <Banner
          role="status"
          aria-live="polite"
          variant="warningSoft"
          icon={TriangleAlert}
          title={t("list.partialPricesTitle")}
          text={t("list.partialPricesText")}
        />
      )}

      <ProductsResults
        query={query}
        isPending={isPending}
        hasError={Boolean(pageError)}
        total={total}
        activeFilterCount={activeFilterCount}
        clearFilters={clearFilters}
        visibleItems={visibleItems}
        viewMode={viewMode}
      />
    </div>
  );
}
