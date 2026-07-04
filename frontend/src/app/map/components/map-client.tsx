"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { MapPinned } from "lucide-react";
import { useTranslations } from "next-intl";

import SearchBar from "@/components/custom/search-bar";
import SearchBarSkeleton from "@/components/custom/search-bar-skeleton";
import ComingSoon from "@/components/custom/coming-soon";

export default function MapClient({ query }: { query: string }) {
  const t = useTranslations("pages.map");
  const pathname = usePathname();

  return (
    <div className="space-y-4">
      <Suspense fallback={<SearchBarSkeleton submitButtonLocation="none" />}>
        <SearchBar
          placeholder={t("searchPlaceholder")}
          searchRoute={pathname}
          clearable={true}
          submitButtonLocation="none"
          autoSearch={true}
        />
      </Suspense>

      <div className="flex items-center justify-between gap-4">
        <h3>
          {query.length > 0
            ? t("searchResultsPlain", { query })
            : t("heading")}
        </h3>
      </div>

      <ComingSoon
        icon={<MapPinned className="size-12 text-primary" />}
        description={t("comingSoon")}
      />
    </div>
  );
}
