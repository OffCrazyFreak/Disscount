import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { DirectoryStoreDto } from "@/lib/api/schemas";
import { getChainLabel, getLocationLabel } from "@/utils/labels";
import { compareHr } from "@/utils/strings";

interface IChainSummaryProps {
  stores: DirectoryStoreDto[];
}

const TOP_CITIES = 6;

/** Picks the "where" sentence: one town, a short list, or a sample of many. */
function citiesKind(count: number): "none" | "one" | "some" | "many" {
  if (count === 0) return "none";
  if (count === 1) return "one";

  return count > TOP_CITIES ? "many" : "some";
}

/**
 * Server-rendered overview of every chain, so the page carries real text for
 * search engines and screen readers alike; the map itself is a canvas that
 * neither can read. Collapsed, since the list above already does the work.
 */
export default async function ChainSummary({ stores }: IChainSummaryProps) {
  const t = await getTranslations("map.summary");
  const byChain = new Map<string, DirectoryStoreDto[]>();

  for (const store of stores) {
    byChain.set(store.chain, [...(byChain.get(store.chain) ?? []), store]);
  }

  const chains = [...byChain].sort(([a], [b]) =>
    compareHr(getChainLabel(a), getChainLabel(b)),
  );

  return (
    <details className="shrink-0 rounded-lg border p-3 text-sm">
      <summary className="cursor-pointer font-medium">{t("title")}</summary>

      <ul className="mt-2 space-y-2">
        {chains.map(([chain, chainStores]) => {
          const cityCounts = new Map<string, number>();

          for (const store of chainStores) {
            const city = getLocationLabel(store.city);
            if (city) cityCounts.set(city, (cityCounts.get(city) ?? 0) + 1);
          }

          const topCities = [...cityCounts]
            .sort((a, b) => b[1] - a[1])
            .slice(0, TOP_CITIES)
            .map(([city]) => city);

          return (
            <li key={chain}>
              <Link
                href={{ pathname: "/map", query: { chain } }}
                className="font-medium hover:underline"
              >
                {getChainLabel(chain)}
              </Link>
              {": "}
              {t("stores", { count: chainStores.length })}
              <span lang="hr">
                {t("where", {
                  kind: citiesKind(cityCounts.size),
                  cities: topCities.join(", "),
                })}
              </span>
            </li>
          );
        })}
      </ul>
    </details>
  );
}
