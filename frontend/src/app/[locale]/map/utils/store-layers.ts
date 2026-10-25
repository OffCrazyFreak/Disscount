import type { ExpressionSpecification } from "maplibre-gl";
import type { LayerProps } from "react-map-gl/maplibre";

import {
  chainIconId,
  COUNT_BADGE_ID,
} from "@/app/[locale]/map/utils/chain-icon";
import { hasChains, rankedChain } from "@/app/[locale]/map/utils/cluster-stack";
import { MAP_FONT_BOLD } from "@/app/[locale]/map/utils/map-style";

export const STORE_SOURCE_ID = "stores";

const POINT_LAYER_ID = "store-point";

function stackLayerId(rank: number): string {
  return `store-cluster-${rank}`;
}

// Back to front: the third chain peeks out on the right, the second on the
// left, and the most common sits in front.
const STACK: { rank: number; offset: [number, number]; rotate: number }[] = [
  { rank: 2, offset: [10, 2], rotate: 10 },
  { rank: 1, offset: [-10, 2], rotate: -10 },
  { rank: 0, offset: [0, 0], rotate: 0 },
];

/** Layers a click can land on, so the map reports features only for these. */
export const INTERACTIVE_LAYER_IDS = [
  POINT_LAYER_ID,
  ...STACK.map(({ rank }) => stackLayerId(rank)),
];

// Pins never hide each other: a store that silently vanished in a dense town
// would read as missing data. Clustering keeps the overlap in check instead.
const ALWAYS_VISIBLE = {
  "icon-allow-overlap": true,
  "icon-ignore-placement": true,
};

const IS_CLUSTER: ExpressionSpecification = ["has", "point_count"];

function chainIcon(chain: ExpressionSpecification): ExpressionSpecification {
  return ["concat", chainIconId(""), chain];
}

/** A lone store: its chain's logo tile. */
export function pointLayer(): LayerProps {
  return {
    id: POINT_LAYER_ID,
    type: "symbol",
    filter: ["!", IS_CLUSTER],
    layout: { "icon-image": chainIcon(["get", "chain"]), ...ALWAYS_VISIBLE },
  };
}

/** Nearby stores of any chain: the three most common logos, fanned. */
export function stackLayers(chains: string[]): LayerProps[] {
  return STACK.map(({ rank, offset, rotate }) => ({
    id: stackLayerId(rank),
    type: "symbol",
    filter: ["all", IS_CLUSTER, hasChains(chains, rank + 1)],
    layout: {
      "icon-image": chainIcon(rankedChain(chains, rank)),
      "icon-size": 0.9,
      "icon-offset": offset,
      "icon-rotate": rotate,
      ...ALWAYS_VISIBLE,
    },
  }));
}

/** The number of stores, on a badge at the stack's top right. */
export function clusterCountLayer(): LayerProps {
  return {
    id: "store-cluster-count",
    type: "symbol",
    filter: IS_CLUSTER,
    layout: {
      "icon-image": COUNT_BADGE_ID,
      "icon-offset": [20, -16],
      "text-field": ["get", "point_count_abbreviated"],
      "text-font": MAP_FONT_BOLD,
      "text-size": 11,
      "text-offset": [1.82, -1.45],
      "text-allow-overlap": true,
      "text-ignore-placement": true,
      ...ALWAYS_VISIBLE,
    },
    paint: { "text-color": "#ffffff" },
  };
}
