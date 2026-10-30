"use client";

import { useEffect, useState } from "react";
import type { GeoJSONFeature, Map as MapLibreMap } from "maplibre-gl";
import { Marker, useMap } from "react-map-gl/maplibre";

import { Badge } from "@/components/ui/badge";
import type { IMapFeatureRef } from "@/app/[locale]/map/utils/map-feature-click";
import { STORE_SOURCE_ID } from "@/app/[locale]/map/utils/store-layers";

interface IClusterCount {
  id: number;
  count: number;
  lon: number;
  lat: number;
  stack: IMapFeatureRef;
}

interface IClusterCountBadgesProps {
  onStackClick: (stack: IMapFeatureRef) => void;
}

/**
 * The store count on each stack, drawn as the app's own count badge over the
 * canvas (MapLibre's "HTML clusters" pattern), so it matches every other badge.
 * Pointer only, like the canvas tiles: the store list is the keyboard path.
 */
export default function ClusterCountBadges({
  onStackClick,
}: IClusterCountBadgesProps) {
  const { current: map } = useMap();
  const [clusters, setClusters] = useState<IClusterCount[]>([]);

  useEffect(() => {
    if (!map) return;

    const mapRef = map.getMap();
    let shown = "";

    // Runs every frame, so React re-renders only when the stacks change.
    function update() {
      const next = mapRef.getSource(STORE_SOURCE_ID)
        ? readClusters(mapRef.querySourceFeatures(STORE_SOURCE_ID), mapRef)
        : [];
      const key = next
        .map(({ id, count, lon, lat }) => `${id}:${count}:${lon}:${lat}`)
        .join();

      if (key !== shown) {
        shown = key;
        setClusters(next);
      }
    }

    mapRef.on("render", update);
    return () => {
      mapRef.off("render", update);
    };
  }, [map]);

  return clusters.map(({ id, count, lon, lat, stack }) => (
    <Marker
      key={id}
      longitude={lon}
      latitude={lat}
      anchor="left"
      offset={[9, -16]}
      onClick={(event) => {
        event.originalEvent.stopPropagation();
        onStackClick(stack);
      }}
    >
      <Badge size="count" ring aria-hidden="true" className="cursor-pointer">
        {count}
      </Badge>
    </Marker>
  ));
}

// Read from the source rather than a stack layer, so a stack of chains with no
// logo yet still gets its count.
function readClusters(
  features: GeoJSONFeature[],
  map: MapLibreMap,
): IClusterCount[] {
  const bounds = map.getBounds();
  const byId = new Map<number, IClusterCount>();

  for (const feature of features) {
    if (feature.properties.cluster_id == null) continue;
    if (feature.geometry.type !== "Point") continue;

    const id = Number(feature.properties.cluster_id);
    const [lon, lat] = feature.geometry.coordinates;
    if (byId.has(id) || !bounds.contains([lon, lat])) continue;

    byId.set(id, {
      id,
      count: Number(feature.properties.point_count),
      lon,
      lat,
      // Source queries leave the feature's source unset, which a tap needs.
      stack: { properties: feature.properties, source: STORE_SOURCE_ID },
    });
  }

  return [...byId.values()].sort((a, b) => a.id - b.id);
}
