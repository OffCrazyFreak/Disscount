import { DirectoryStoreDto } from "@/lib/api/schemas";
import { getChainLabel, getLocationLabel } from "@/utils/labels";
import { compareHr, pluralizeCroatian } from "@/utils/strings";

interface IChainSummaryProps {
  stores: DirectoryStoreDto[];
}

const TOP_CITIES = 6;

/**
 * Server-rendered overview of every chain, so the page carries real text for
 * search engines and screen readers alike; the map itself is a canvas that
 * neither can read. Collapsed, since the list above already does the work.
 */
export default function ChainSummary({ stores }: IChainSummaryProps) {
  const byChain = new Map<string, DirectoryStoreDto[]>();

  for (const store of stores) {
    byChain.set(store.chain, [...(byChain.get(store.chain) ?? []), store]);
  }

  const chains = [...byChain].sort(([a], [b]) =>
    compareHr(getChainLabel(a), getChainLabel(b)),
  );

  return (
    <details className="shrink-0 rounded-lg border p-3 text-sm">
      <summary className="cursor-pointer font-medium">
        Trgovine po lancima
      </summary>

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

          const where =
            cityCounts.size === 0
              ? ""
              : cityCounts.size === 1
                ? `, u mjestu ${topCities[0]}`
                : cityCounts.size > TOP_CITIES
                  ? `, među ostalim u mjestima ${topCities.join(", ")}`
                  : `, u mjestima ${topCities.join(", ")}`;

          return (
            <li key={chain}>
              <a
                href={`/map?chain=${encodeURIComponent(chain)}`}
                className="font-medium hover:underline"
              >
                {getChainLabel(chain)}
              </a>
              {": "}
              {chainStores.length}{" "}
              {pluralizeCroatian(
                chainStores.length,
                "trgovina",
                "trgovine",
                "trgovina",
              )}
              {where}
            </li>
          );
        })}
      </ul>
    </details>
  );
}
