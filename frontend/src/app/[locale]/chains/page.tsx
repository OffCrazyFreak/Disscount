import type { Metadata, ResolvingMetadata } from "next";
import { withSharePreview } from "@/utils/share-metadata";
import { connection } from "next/server";
import { getLocale, getTranslations } from "next-intl/server";

import { storeCountsByChain } from "@/app/[locale]/chains/utils/chain-stores";
import {
  hubRobots,
  isHubIndexable,
} from "@/app/[locale]/categories/utils/category-page";
import PageBreadcrumbs from "@/components/custom/common/page-breadcrumbs";
import StoreChainLogo from "@/components/custom/store-chain/store-chain-logo";
import { localizedUrl } from "@/i18n/alternates";
import { Link } from "@/i18n/navigation";
import { getServerChainStats } from "@/lib/cijene-api/server/get-chain-stats";
import { getStoreDirectory } from "@/lib/store-locations/get-store-directory";
import {
  CHAINS_PATH,
  MAPPED_CHAIN_CODES,
  chainPath,
} from "@/utils/chain-links";
import { getChainLabel } from "@/utils/labels";
import { compareHr, formatDate } from "@/utils/strings";

export async function generateMetadata(
  _props: PageProps<"/[locale]/chains">,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("chains");

  return withSharePreview(
    {
      title: t("meta.indexTitle"),
      description: t("meta.indexDescription"),
      alternates: { canonical: localizedUrl(CHAINS_PATH, locale) },
      ...hubRobots(isHubIndexable(locale)),
    },
    parent,
  );
}

export default async function ChainsPage() {
  // Upstream and the store database are not reachable while the Docker image builds, so this renders per request.
  await connection();
  const locale = await getLocale();
  const t = await getTranslations("chains");
  const [stats, directory] = await Promise.all([
    getServerChainStats(),
    getStoreDirectory(),
  ]);

  const storeCounts = storeCountsByChain(directory.stores);
  const priceDates = new Map(
    (stats ?? []).map((stat) => [stat.chain_code, stat.price_date]),
  );
  const chains = MAPPED_CHAIN_CODES.map((code) => ({
    code,
    name: getChainLabel(code),
    storeCount: storeCounts.get(code) ?? 0,
    priceDate: priceDates.get(code) ?? null,
  })).sort((a, b) => b.storeCount - a.storeCount || compareHr(a.name, b.name));

  return (
    <div className="space-y-6">
      <PageBreadcrumbs
        label={t("breadcrumbs.label")}
        steps={[
          { label: t("breadcrumbs.home"), path: "/" },
          { label: t("breadcrumbs.chains"), path: CHAINS_PATH },
        ]}
        locale={locale}
      />

      <h1 className="text-3xl font-bold text-pretty">{t("index.heading")}</h1>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {chains.map((chain) => (
          <li key={chain.code}>
            <Link
              href={chainPath(chain.code)}
              className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm transition-shadow hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span
                aria-hidden="true"
                className="size-10 shrink-0 overflow-hidden rounded-sm"
              >
                <StoreChainLogo chain={chain.code} className="object-contain" />
              </span>

              <span className="min-w-0 flex-1">
                <span lang="hr" className="block font-medium">
                  {chain.name}
                </span>

                <span className="block text-sm text-muted-foreground">
                  {t("index.storeCount", { count: chain.storeCount })}
                  {chain.priceDate &&
                    `, ${t("index.priceDate", { date: formatDate(chain.priceDate, locale) })}`}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
