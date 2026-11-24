import { Suspense } from "react";
import { useTranslations } from "next-intl";
import ProductSearchBar from "@/components/custom/search/product-search-bar";
import SearchBarSkeleton from "@/components/custom/search/search-bar-skeleton";

export default function HeaderSearch() {
  const t = useTranslations("shell");

  return (
    <div className="max-w-72 hidden lg:block flex-1 ml-auto">
      <Suspense fallback={<SearchBarSkeleton submitButtonLocation="none" />}>
        <ProductSearchBar
          placeholder={t("search.productsPlaceholder")}
          submitButtonLocation="none"
          allowScanning={true}
        />
      </Suspense>
    </div>
  );
}
