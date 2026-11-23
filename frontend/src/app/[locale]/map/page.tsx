import { Suspense } from "react";
import type { Metadata, ResolvingMetadata } from "next";
import { withSharePreview } from "@/utils/share-metadata";
import { headers } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";

import MapClient from "@/app/[locale]/map/components/map-client";
import { readIpLocation } from "@/app/[locale]/map/utils/ip-location";
import { pageAlternates } from "@/i18n/alternates";

// Reads the visitor's location headers on every request.
export const dynamic = "force-dynamic";

export async function generateMetadata(
  _props: PageProps<"/[locale]/map">,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("map");

  return withSharePreview(
    {
      title: t("meta.title"),
      description: t("meta.description"),
      alternates: pageAlternates("/map", locale),
    },
    parent,
  );
}

export default async function MapPage() {
  const t = await getTranslations("map");
  const ipLocation = readIpLocation(await headers());

  return (
    <>
      <h1 className="sr-only">{t("heading")}</h1>

      <Suspense fallback={null}>
        <MapClient ipLocation={ipLocation} />
      </Suspense>
    </>
  );
}
