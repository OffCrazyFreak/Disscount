import { Suspense } from "react";
import { Metadata } from "next";
import { headers } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";

import ChainSummary from "@/app/[locale]/map/components/chain-summary";
import MapClient from "@/app/[locale]/map/components/map-client";
import { readIpLocation } from "@/app/[locale]/map/utils/ip-location";
import { isVisitableStore } from "@/app/[locale]/map/utils/visitable-store";
import { pageAlternates } from "@/i18n/alternates";
import { getStoreDirectory } from "@/lib/store-locations/get-store-directory";

// Reads the database and upstream on request, never at build time.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("map");

  return {
    title: t("meta.title"),
    description: t("meta.description"),
    alternates: pageAlternates("/map", locale),
  };
}

async function loadVisitableStores() {
  try {
    return (await getStoreDirectory()).stores.filter(isVisitableStore);
  } catch {
    // The client loads the same list itself; the overview is a bonus.
    return null;
  }
}

async function ChainSummaryLoader() {
  const stores = await loadVisitableStores();

  return stores ? <ChainSummary stores={stores} /> : null;
}

export default async function MapPage() {
  const t = await getTranslations("map");
  const ipLocation = readIpLocation(await headers());

  return (
    <>
      <h1 className="sr-only">{t("heading")}</h1>

      <Suspense fallback={null}>
        <MapClient
          ipLocation={ipLocation}
          chainSummary={
            // Streamed, so the directory fetch never holds up the first byte.
            <Suspense fallback={null}>
              <ChainSummaryLoader />
            </Suspense>
          }
        />
      </Suspense>
    </>
  );
}
