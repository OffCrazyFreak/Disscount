"use client";

import type { ComponentProps } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";

import MapErrorBoundary from "@/app/[locale]/map/components/map-error-boundary";
import MapUnavailable from "@/app/[locale]/map/components/map-unavailable";

// MapLibre touches window and WebGL on import, and weighs about 430 KB gzip
// with its worker, so it loads in the browser and only on this page.
const StoreMap = dynamic(
  () => import("@/app/[locale]/map/components/store-map"),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-full animate-pulse bg-muted motion-reduce:animate-none"
        aria-hidden="true"
      />
    ),
  },
);

type IStoreMapLoaderProps = ComponentProps<typeof StoreMap>;

export default function StoreMapLoader(props: IStoreMapLoaderProps) {
  const t = useTranslations("map.unavailable");

  return (
    <MapErrorBoundary fallback={<MapUnavailable message={t("browser")} />}>
      <StoreMap {...props} />
    </MapErrorBoundary>
  );
}
