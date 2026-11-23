import { Suspense } from "react";
import { Metadata } from "next";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";

import MapClient from "@/app/[locale]/map/components/map-client";
import { readIpLocation } from "@/app/[locale]/map/utils/ip-location";
import { pageMetadata } from "@/i18n/alternates";

// Reads the visitor's location headers on every request.
export const dynamic = "force-dynamic";

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata("map", "/map");
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
