"use client";

import { useEffect, useState } from "react";
import type { MapGeoJSONFeature } from "maplibre-gl";
import { Marker, useMap } from "react-map-gl/maplibre";

import { Badge } from "@/components/ui/badge";
import { TOP_STACK_LAYER_ID } from "@/app/[locale]/map/utils/store-layers";

interface IClusterCount {
  id: number;
  count: number;
  lon: number;
  lat: number;
}

/**
 * The store count on each stack, drawn as the app's own count badge over the
 * canvas (MapLibre's "HTML clusters" pattern), so it matches every other badge.
 * Decorative: the store list carries the same information for assistive tech.
 */
export default function ClusterCountBadges() {
  const { current: map } = useMap();
  const [clusters, setClusters] = useState<IClusterCount[]>([]);

  useEffect(() => {
    if (!map) return;

    const mapRef = map;
    let shown = "";

    // Runs every frame, so React re-renders only when the set of stacks changes.
    function update() {
      if (!mapRef.getMap().getLayer(TOP_STACK_LAYER_ID)) return;

      const next = readClusters(
        mapRef.getMap().queryRenderedFeatures({ layers: [TOP_STACK_LAYER_ID] }),
      );
      const key = next
        .map((cluster) => `${cluster.id}:${cluster.count}`)
        .join();

      if (key !== shown) {
        shown = key;
        setClusters(next);
      }
    }

    map.on("render", update);
    return () => {
      map.off("render", update);
    };
  }, [map]);

  return clusters.map(({ id, count, lon, lat }) => (
    <Marker
      key={id}
      longitude={lon}
      latitude={lat}
      anchor="left"
      offset={[9, -16]}
      style={{ pointerEvents: "none" }}
    >
      <Badge size="count" ring aria-hidden="true">
        {count}
      </Badge>
    </Marker>
  ));
}

function readClusters(features: MapGeoJSONFeature[]): IClusterCount[] {
  const byId = new Map<number, IClusterCount>();

  for (const feature of features) {
    const id = Number(feature.properties.cluster_id);
    if (byId.has(id) || feature.geometry.type !== "Point") continue;

    const [lon, lat] = feature.geometry.coordinates;
    byId.set(id, {
      id,
      count: Number(feature.properties.point_count),
      lon,
      lat,
    });
  }

  return [...byId.values()].sort((a, b) => a.id - b.id);
}
