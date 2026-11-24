import { Suspense } from "react";
import type { Metadata, ResolvingMetadata } from "next";
import { withSharePreview } from "@/utils/seo/share-metadata";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";

import MapClient from "@/features/map/components/map-client";
import { readIpLocation } from "@/features/map/utils/view/ip-location";
import { pageMetadata } from "@/i18n/alternates";

// Reads the visitor's location headers on every request.
export const dynamic = "force-dynamic";

export async function generateMetadata(
  _props: PageProps<"/[locale]/map">,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  return withSharePreview(await pageMetadata("map", "/map"), parent);
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
