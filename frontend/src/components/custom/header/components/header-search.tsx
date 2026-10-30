import { Suspense } from "react";
import { useTranslations } from "next-intl";
import SearchBar from "@/components/custom/search/search-bar";
import SearchBarSkeleton from "@/components/custom/search/search-bar-skeleton";

export default function HeaderSearch() {
  const t = useTranslations("shell");

  return (
    <div className="max-w-72 hidden lg:block flex-1 ml-auto">
      <Suspense fallback={<SearchBarSkeleton submitButtonLocation="none" />}>
        <SearchBar
          placeholder={t("search.productsPlaceholder")}
          searchRoute="/products"
          submitButtonLocation="none"
          clearable={true}
          allowScanning={true}
        />
      </Suspense>
    </div>
  );
}
