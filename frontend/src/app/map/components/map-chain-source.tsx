"use client";

import { Layer, Source } from "react-map-gl/maplibre";

import { IStoreFeatureCollection } from "@/app/map/utils/chain-geojson";
import {
  chainSourceId,
  clusterCountLayer,
  clusterLayer,
  pointLayer,
} from "@/app/map/utils/chain-layers";

interface IMapChainSourceProps {
  chain: string;
  data: IStoreFeatureCollection;
}

/**
 * One chain's stores. Clustering per chain is what lets a group show its own
 * logo with a count, then split into single logos as the user zooms in.
 */
export default function MapChainSource({ chain, data }: IMapChainSourceProps) {
  return (
    <Source
      id={chainSourceId(chain)}
      type="geojson"
      data={data}
      cluster
      clusterRadius={44}
      clusterMaxZoom={15}
    >
      <Layer {...clusterLayer(chain)} />
      <Layer {...clusterCountLayer(chain)} />
      <Layer {...pointLayer(chain)} />
    </Source>
  );
}
