import type { LayerProps } from "react-map-gl/maplibre";

import {
  chainIconId,
  COUNT_BADGE_ID,
} from "@/app/[locale]/map/utils/chain-icon";
import { MAP_FONT_BOLD } from "@/app/[locale]/map/utils/map-style";

export function chainSourceId(chain: string): string {
  return `stores-${chain}`;
}

function pointLayerId(chain: string): string {
  return `point-${chain}`;
}

function clusterLayerId(chain: string): string {
  return `cluster-${chain}`;
}

/** Layers a click can land on, so the map reports features only for these. */
export function interactiveLayerIds(chains: string[]): string[] {
  return chains.flatMap((chain) => [
    pointLayerId(chain),
    clusterLayerId(chain),
  ]);
}

// Pins never hide each other: a store that silently vanished in a dense town
// would read as missing data. Clustering keeps the overlap in check instead.
const ALWAYS_VISIBLE = {
  "icon-allow-overlap": true,
  "icon-ignore-placement": true,
};

/** A lone store: just its chain's logo. */
export function pointLayer(chain: string): LayerProps {
  return {
    id: pointLayerId(chain),
    type: "symbol",
    filter: ["!", ["has", "point_count"]],
    layout: { "icon-image": chainIconId(chain), ...ALWAYS_VISIBLE },
  };
}

/** Several stores of one chain: the same logo, slightly larger. */
export function clusterLayer(chain: string): LayerProps {
  return {
    id: clusterLayerId(chain),
    type: "symbol",
    filter: ["has", "point_count"],
    layout: {
      "icon-image": chainIconId(chain),
      "icon-size": 1.15,
      ...ALWAYS_VISIBLE,
    },
  };
}

/** The number of stores, on a badge at the logo's top right. */
export function clusterCountLayer(chain: string): LayerProps {
  return {
    id: `cluster-count-${chain}`,
    type: "symbol",
    filter: ["has", "point_count"],
    layout: {
      "icon-image": COUNT_BADGE_ID,
      "icon-offset": [17, -17],
      "text-field": ["get", "point_count_abbreviated"],
      "text-font": MAP_FONT_BOLD,
      "text-size": 11,
      "text-offset": [1.55, -1.55],
      "text-allow-overlap": true,
      "text-ignore-placement": true,
      ...ALWAYS_VISIBLE,
    },
    paint: { "text-color": "#ffffff" },
  };
}
