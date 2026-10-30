"use client";

import { RefObject, Suspense } from "react";
import { useTranslations } from "next-intl";

import SearchBar from "@/components/custom/search/search-bar";
import SearchBarSkeleton from "@/components/custom/search/search-bar-skeleton";

interface IMapSearchProps {
  inputRef?: RefObject<HTMLInputElement | null>;
}

/** The store search, filtering the list and the map as you type. */
export default function MapSearch({ inputRef }: IMapSearchProps) {
  const t = useTranslations("map");

  return (
    <Suspense fallback={<SearchBarSkeleton submitButtonLocation="none" />}>
      <SearchBar
        placeholder={t("search.placeholder")}
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
