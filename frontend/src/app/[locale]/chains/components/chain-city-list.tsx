import { getTranslations } from "next-intl/server";
import { ChevronDown } from "lucide-react";

import type { IChainCity } from "@/app/[locale]/chains/utils/chain-stores";

/** Enough to cover every town with more than a store or two for the big chains, without a page-long list. */
const VISIBLE_CITY_COUNT = 20;

const CITY_GRID_CLASS = "grid gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3";

interface IChainCityListProps {
  cities: IChainCity[];
}

export default async function ChainCityList({ cities }: IChainCityListProps) {
  const t = await getTranslations("chains");

  const shown = cities.slice(0, VISIBLE_CITY_COUNT);
  const more = cities.slice(VISIBLE_CITY_COUNT);

  function cityItems(list: IChainCity[]) {
    return list.map(({ city, storeCount }) => (
      <li
        key={city}
        className="flex items-baseline justify-between gap-3 border-b py-1.5"
      >
        <span lang="hr">{city}</span>

        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {t("cities.storeCount", { count: storeCount })}
        </span>
      </li>
    ));
  }

  return (
    <section aria-labelledby="chain-cities" className="space-y-3">
      <h2 id="chain-cities" className="text-lg font-semibold">
        {t("cities.heading")}
      </h2>

      <ul className={CITY_GRID_CLASS}>{cityItems(shown)}</ul>

      {/* A native disclosure keeps every town in the server HTML for crawlers, and works without JavaScript. */}
      {more.length > 0 && (
        <details className="group space-y-3">
          <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-primary hover:underline [&::-webkit-details-marker]:hidden">
            {t("cities.showMore", { count: more.length })}

            <ChevronDown
              aria-hidden="true"
              className="size-4 transition-transform group-open:rotate-180 motion-reduce:transition-none"
            />
          </summary>

          <ul className={CITY_GRID_CLASS}>{cityItems(more)}</ul>
        </details>
      )}
    </section>
  );
}
