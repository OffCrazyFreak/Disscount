"use client";

import type { ComponentProps } from "react";
import dynamic from "next/dynamic";

import MapErrorBoundary from "@/app/map/components/map-error-boundary";
import MapUnavailable from "@/app/map/components/map-unavailable";

// MapLibre touches window and WebGL on import, and weighs about 430 KB gzip
// with its worker, so it loads in the browser and only on this page.
const StoreMap = dynamic(() => import("@/app/map/components/store-map"), {
  ssr: false,
  loading: () => (
    <div className="h-full animate-pulse bg-muted" aria-hidden="true" />
  ),
});

type IStoreMapLoaderProps = ComponentProps<typeof StoreMap>;

export default function StoreMapLoader(props: IStoreMapLoaderProps) {
  return (
    <MapErrorBoundary
      fallback={
        <MapUnavailable message="Tvoj preglednik ne može prikazati kartu. Sve trgovine i dalje su na popisu." />
      }
    >
      <StoreMap {...props} />
    </MapErrorBoundary>
  );
}
