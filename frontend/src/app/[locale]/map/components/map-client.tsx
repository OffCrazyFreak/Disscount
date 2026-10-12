"use client";

import { usePathname } from "@/i18n/navigation";
import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { MapPinned } from "lucide-react";

import SearchBar from "@/components/custom/search/search-bar";
import SearchBarSkeleton from "@/components/custom/search/search-bar-skeleton";
import ComingSoon from "@/components/custom/common/coming-soon";

interface IMapClientProps {
  query: string;
}

export default function MapClient({ query }: IMapClientProps) {
  const t = useTranslations("map");
  const pathname = usePathname();

  return (
    <div className="space-y-4">
      <Suspense fallback={<SearchBarSkeleton submitButtonLocation="none" />}>
        <SearchBar
          placeholder={t("search.placeholder")}
          searchRoute={pathname}
          clearable={true}
          submitButtonLocation="none"
          autoSearch={true}
        />
      </Suspense>

      <div className="flex items-center justify-between gap-4">
        <h3>
          {query.length > 0
            ? t("heading.results", { query })
            : t("heading.default")}
        </h3>
      </div>

      <ComingSoon
        icon={<MapPinned className="size-12 text-primary" />}
        description={t("comingSoon")}
      />
    </div>
  );
}
