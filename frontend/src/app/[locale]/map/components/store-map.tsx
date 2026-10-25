"use client";

import { useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import MapUnavailable from "@/app/[locale]/map/components/map-unavailable";
import StoreMapView, {
  IStoreMapViewProps,
} from "@/app/[locale]/map/components/store-map-view";
import { loadMapStyle } from "@/app/[locale]/map/utils/map-style";

// Under webpack, import.meta.url is the only way to hand MapLibre its worker
// file; without it the map mounts but never loads a tile.
maplibregl.setWorkerUrl(
  new URL(
    "maplibre-gl/dist/maplibre-gl-worker.mjs",
    import.meta.url,
  ).toString(),
);

type IStoreMapProps = Omit<IStoreMapViewProps, "mapStyle" | "onContextLost">;

/** The map once its style loads, or a placeholder or an error instead. */
export default function StoreMap(props: IStoreMapProps) {
  const t = useTranslations("map.unavailable");
  const [contextLost, setContextLost] = useState(false);

  const style = useQuery({
    queryKey: ["map-style"],
    queryFn: ({ signal }) => loadMapStyle(signal),
    staleTime: Infinity,
  });

  if (style.isError) {
    return <MapUnavailable message={t("style")} />;
  }

  if (contextLost) {
    return (
      <MapUnavailable
        message={t("contextLost")}
        action={{
          label: t("reload"),
          onClick: () => window.location.reload(),
        }}
      />
    );
  }

  if (!style.data)
    return (
      <div
        className="h-full animate-pulse bg-muted motion-reduce:animate-none"
        aria-hidden="true"
      />
    );

  return (
    <StoreMapView
      {...props}
      mapStyle={style.data}
      onContextLost={() => setContextLost(true)}
    />
  );
}
