import type { Metadata, ResolvingMetadata } from "next";
import { withSharePreview } from "@/utils/share-metadata";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import ChainCityList from "@/app/[locale]/chains/components/chain-city-list";
import ChainIntro from "@/app/[locale]/chains/components/chain-intro";
import {
  chainStores,
  citiesByStoreCount,
  hasChainContent,
} from "@/app/[locale]/chains/utils/chain-stores";
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
  chainMapPath,
  chainPath,
  isMappedChain,
} from "@/utils/chain-links";
import { getChainLabel } from "@/utils/labels";

type ChainPageProps = PageProps<"/[locale]/chains/[slug]">;

/** Null for a chain we do not map, decided before any lookup; an outage throws, so the page answers 500. */
async function loadChain(props: ChainPageProps) {
  const { slug: code } = await props.params;
  if (!isMappedChain(code)) return null;

  const [stats, directory] = await Promise.all([
    getServerChainStats(),
    getStoreDirectory(),
  ]);
  const stores = chainStores(directory.stores, code);

  return {
    code,
    name: getChainLabel(code),
    stats: stats?.find((stat) => stat.chain_code === code) ?? null,
    storeCount: stores.length,
    hasContent: hasChainContent(stores.length, stats, code),
    cities: citiesByStoreCount(stores),
  };
}

export async function generateMetadata(
  props: ChainPageProps,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const chain = await loadChain(props);
  if (!chain) return { robots: { index: false, follow: false } };

  const locale = await getLocale();
  const t = await getTranslations("chains");

  return withSharePreview(
    {
      title: t("meta.chainTitle", { chain: chain.name }),
      description: t("meta.chainDescription", {
        chain: chain.name,
        stores: chain.storeCount,
      }),
      // No hreflang: only the Croatian hub can be indexed, as with the category hubs.
      alternates: { canonical: localizedUrl(chainPath(chain.code), locale) },
      ...hubRobots(isHubIndexable(locale) && chain.hasContent),
    },
    parent,
  );
}

export default async function ChainPage(props: ChainPageProps) {
  // No loading.tsx sits above this page, so the 404 status still holds.
  const chain = await loadChain(props);
  if (!chain) notFound();

  const locale = await getLocale();
  const t = await getTranslations("chains");

  return (
    <div className="space-y-4">
      <PageBreadcrumbs
        label={t("breadcrumbs.label")}
        steps={[
          { label: t("breadcrumbs.home"), path: "/" },
          { label: t("breadcrumbs.chains"), path: CHAINS_PATH },
          { label: chain.name, path: chainPath(chain.code) },
        ]}
        locale={locale}
      />

      <div className="flex items-center gap-4">
        <div
          aria-hidden="true"
          className="size-14 shrink-0 overflow-hidden rounded-sm shadow-sm"
        >
          <StoreChainLogo chain={chain.code} className="object-contain" />
        </div>

        <h1 lang="hr">{chain.name}</h1>
      </div>

      <ChainIntro
        chainName={chain.name}
        storeCount={chain.storeCount}
        cities={chain.cities}
        stats={chain.stats}
      />

      <p>
        <Link
          href={chainMapPath(chain.code)}
          className="text-primary hover:underline"
        >
          {t("mapLink", { chain: chain.name })}
        </Link>
      </p>

      {chain.cities.length > 0 && <ChainCityList cities={chain.cities} />}
    </div>
  );
}
