"use client";

import { useTranslations } from "next-intl";
import type { IStoreTown } from "@/utils/store-towns";

/** A town's name, with its county only when another town shares the name. */
export function useTownLabel() {
  const t = useTranslations("common.towns");

  return function townLabel({
    name,
    county,
  }: Pick<IStoreTown, "name" | "county">) {
    return county
      ? t("withCounty", { town: name, county: t(`counties.${county}`) })
      : name;
  };
}
