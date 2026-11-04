"use client";

import { RefObject, Suspense } from "react";
import { useTranslations } from "next-intl";

import SearchBar from "@/components/custom/search/search-bar";
import SearchBarSkeleton from "@/components/custom/search/search-bar-skeleton";
import { useIsMobile } from "@/hooks/use-mobile";

interface IMapSearchProps {
  inputRef?: RefObject<HTMLInputElement | null>;
}

/** The store search, filtering the list and the map as you type. */
export default function MapSearch({ inputRef }: IMapSearchProps) {
  const t = useTranslations("map");
  const isMobile = useIsMobile();

  return (
    <Suspense fallback={<SearchBarSkeleton submitButtonLocation="none" />}>
      <SearchBar
        placeholder={
          isMobile ? t("search.placeholderShort") : t("search.placeholder")
        }
        ariaLabel={t("search.placeholder")}
        searchRoute="/map"
        clearable
        autoSearch
        shallow
        submitButtonLocation="none"
        inputRef={inputRef}
      />
    </Suspense>
  );
}
