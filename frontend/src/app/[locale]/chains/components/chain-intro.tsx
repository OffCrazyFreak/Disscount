import { getLocale, getTranslations } from "next-intl/server";

import {
  topCitiesPhrase,
  type IChainCity,
} from "@/app/[locale]/chains/utils/chain-stores";
import type { ChainStats } from "@/lib/cijene-api/schemas";
import { formatDate } from "@/utils/format/strings";

interface IChainIntroProps {
  chainName: string;
  storeCount: number;
  cities: IChainCity[];
  /** Null when upstream lists no prices for the chain, which drops that sentence. */
  stats: ChainStats | null;
}

/** Live numbers only, so the text never claims more than the map and the price API show. */
export default async function ChainIntro({
  chainName,
  storeCount,
  cities,
  stats,
}: IChainIntroProps) {
  const t = await getTranslations("chains");
  const locale = await getLocale();
  const topCities = topCitiesPhrase(cities, locale);

  return (
    <p className="text-muted-foreground text-pretty">
      {storeCount > 0
        ? t("intro.stores", {
            chain: chainName,
            stores: storeCount,
            cities: cities.length,
          })
        : t("intro.noStores", { chain: chainName })}

      {topCities && <> {t("intro.topCities", { cities: topCities })}</>}

      {stats && (
        <>
          {" "}
          {t("intro.prices", {
            date: formatDate(stats.price_date, locale),
            count: stats.price_count,
          })}
        </>
      )}
    </p>
  );
}
