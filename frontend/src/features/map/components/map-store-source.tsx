"use client";

import { Layer, Source } from "react-map-gl/maplibre";

import ClusterCountBadges from "@/features/map/components/cluster-count-badges";
import type { IMapFeatureRef } from "@/features/map/utils/map-feature-click";
import { chainCountProperties } from "@/features/map/utils/cluster-stack";
import { IStoreFeatureCollection } from "@/features/map/utils/store-geojson";
import {
  pointLayer,
  stackLayers,
  STORE_SOURCE_ID,
} from "@/features/map/utils/store-layers";

export const MAP_MAX_ZOOM = 20;

interface IMapStoreSourceProps {
  chains: string[];
  data: IStoreFeatureCollection;
  onStackClick: (stack: IMapFeatureRef) => void;
}

/** Deepest zoom, because stores sharing an address never split, so they stay one stack. */
export default function MapStoreSource({
  chains,
  data,
  onStackClick,
}: IMapStoreSourceProps) {
  return (
    <>
      <Source
        id={STORE_SOURCE_ID}
        type="geojson"
        data={data}
        cluster
        clusterRadius={50}
        clusterMaxZoom={MAP_MAX_ZOOM}
        maxzoom={MAP_MAX_ZOOM + 1}
        clusterProperties={chainCountProperties(chains)}
      >
        {stackLayers(chains).map((layer) => (
          <Layer key={layer.id} {...layer} />
        ))}
        <Layer {...pointLayer()} />
      </Source>

      <ClusterCountBadges onStackClick={onStackClick} />
    </>
  );
}
