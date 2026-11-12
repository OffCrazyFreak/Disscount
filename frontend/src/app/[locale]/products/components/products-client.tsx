"use client";

import { usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { TriangleAlert } from "lucide-react";
import { useViewMode } from "@/hooks/use-view-mode";
import useInfiniteProducts from "@/app/[locale]/products/hooks/use-infinite-products";
import useProductFilters from "@/app/[locale]/products/hooks/use-product-filters";
import ProductFiltersBar from "@/app/[locale]/products/components/product-filters-bar";
import ProductsResults from "@/app/[locale]/products/components/products-results";
import ProductsResultsStatus from "@/app/[locale]/products/components/products-results-status";
import ProductsResultsTitle from "@/app/[locale]/products/components/products-results-title";
import { Suspense } from "react";
import ProductSearchBar from "@/components/custom/search/product-search-bar";
import { useRecordProductSearch } from "@/components/custom/search/use-record-product-search";
import SearchBarSkeleton from "@/components/custom/search/search-bar-skeleton";
import { Banner } from "@/components/custom/common/banner";
import ScrollCue from "@/components/custom/fab/scroll-cue";

interface IProductsClientProps {
  query: string;
}

export default function ProductsClient({ query }: IProductsClientProps) {
  const t = useTranslations("products");
  const pathname = usePathname();
  // TODO(#61): take the setter once ViewSwitcher is unparked below; the mode is read-only until then.
  const [viewMode] = useViewMode(pathname);

  const filters = useProductFilters();
  const {
    selectedChains,
    selectedCategories,
    selectedBrands,
    selectedLocations,
    selectedSourceCities,
    allowedChains,
    locationsReady,
    locationsError,
    activeFilterCount,
    clearFilters,
    setFilter,
  } = filters;

  const {
    visibleItems,
    total,
    isTruncated,
    isLoading,
    isRefreshing,
    error,
    hasPartialPriceData,
    hasMatchesOutsideLocations,
  } = useInfiniteProducts(query, {
    allowedChains,
    selectedChains,
    selectedCategories,
    selectedBrands,
    selectedLocations,
    selectedSourceCities,
  });

  // A location filter is set but the city -> chains mapping is still loading
  const waitingForLocations = Boolean(query) && !locationsReady;
  const isPending = isLoading || waitingForLocations;
  const isSettled = !isPending && !isRefreshing;
  const pageError = error || locationsError;
  useRecordProductSearch(query, isSettled && !pageError && total > 0);
  const showPartialPricesBanner =
    hasPartialPriceData && !isPending && !pageError;

  return (
    <div className="space-y-4">
      <Suspense fallback={<SearchBarSkeleton />}>
        <ProductSearchBar
          placeholder={t("list.searchPlaceholder")}
          allowScanning={true}
        />
      </Suspense>

      <ProductFiltersBar filters={filters} query={query} />

      <div className="flex items-center justify-between gap-4">
        <ProductsResultsTitle
          query={query}
          isSettled={isSettled}
          total={total}
          isTruncated={isTruncated}
        />

        {/* TODO: re-enable with personalisable list views (see view-switcher.tsx) */}
        {/* <ViewSwitcher viewMode={viewMode} setViewMode={setViewMode} /> */}
      </div>

      <ProductsResultsStatus
        query={query}
        isPending={!isSettled}
        hasError={Boolean(pageError)}
        total={total}
        isTruncated={isTruncated}
        noPriceLocations={hasMatchesOutsideLocations ? selectedLocations : []}
      />

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
        isRefreshing={isRefreshing}
        hasError={Boolean(pageError)}
        total={total}
        activeFilterCount={activeFilterCount}
        clearFilters={clearFilters}
        selectedLocations={selectedLocations}
        hasMatchesOutsideLocations={hasMatchesOutsideLocations}
        showAllLocations={() => setFilter("location", [])}
        visibleItems={visibleItems}
        viewMode={viewMode}
      />

      <ScrollCue />
    </div>
  );
}
