import { getTranslations } from "next-intl/server";

import type { IChainCity } from "@/app/[locale]/chains/utils/chain-stores";

interface IChainCityListProps {
  cities: IChainCity[];
}

export default async function ChainCityList({ cities }: IChainCityListProps) {
  const t = await getTranslations("chains");

  return (
    <section aria-labelledby="chain-cities" className="space-y-3">
      <h2 id="chain-cities" className="text-lg font-semibold">
        {t("cities.heading")}
      </h2>

      <ul className="grid gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
        {cities.map(({ city, storeCount }) => (
          <li
            key={city}
            className="flex items-baseline justify-between gap-3 border-b py-1.5"
          >
            <span lang="hr">{city}</span>

            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {t("cities.storeCount", { count: storeCount })}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
