"use client";

import { Layer, Source } from "react-map-gl/maplibre";

import ClusterCountBadges from "@/app/[locale]/map/components/cluster-count-badges";
import { chainCountProperties } from "@/app/[locale]/map/utils/cluster-stack";
import { IStoreFeatureCollection } from "@/app/[locale]/map/utils/store-geojson";
import {
  pointLayer,
  stackLayers,
  STORE_SOURCE_ID,
} from "@/app/[locale]/map/utils/store-layers";

/** Deepest zoom the map allows. */
export const MAP_MAX_ZOOM = 20;

interface IMapStoreSourceProps {
  chains: string[];
  data: IStoreFeatureCollection;
}

/**
 * Every store in one source, so nearby stores of any chain merge into one
 * stack. Clustering runs to the deepest zoom: stores sharing an address (a
 * mall) never split apart, so they stay one stack that opens as a list.
 */
export default function MapStoreSource({ chains, data }: IMapStoreSourceProps) {
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

      <ClusterCountBadges />
    </>
  );
}
