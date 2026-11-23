"use client";

import type { ComponentProps } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";

import MapErrorBoundary from "@/features/map/components/canvas/map-error-boundary";
import MapUnavailable from "@/features/map/components/canvas/map-unavailable";
import { useCreditsBannerHold } from "@/features/map/hooks/layout/use-credits-banner-hold";

// MapLibre touches window on import and weighs about 430 KB gzip, so it loads only on this page.
const StoreMap = dynamic(
  () => import("@/features/map/components/canvas/store-map"),
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

  useCreditsBannerHold();

  return (
    <MapErrorBoundary fallback={<MapUnavailable message={t("browser")} />}>
      <StoreMap {...props} />
    </MapErrorBoundary>
  );
}
