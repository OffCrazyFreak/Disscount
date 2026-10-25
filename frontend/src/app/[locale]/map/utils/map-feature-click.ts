import * as maplibregl from "maplibre-gl";
import type { MapLayerMouseEvent, MapRef } from "react-map-gl/maplibre";

import {
  IClusterLeaf,
  fitPadding,
  isSameSpot,
  leafBounds,
} from "@/app/[locale]/map/utils/cluster-leaves";

type ILeafFeature = Awaited<
  ReturnType<maplibregl.GeoJSONSource["getClusterLeaves"]>
>[number];

export interface ISameSpot {
  lon: number;
  lat: number;
  keys: string[];
}

interface IMapClickActions {
  onSelect: (key: string) => void;
  onSameSpot: (spot: ISameSpot) => void;
  /** Map pixels hidden under the phone sheet, kept clear when zooming in. */
  coveredBottom: number;
}

function toLeaf(feature: ILeafFeature): IClusterLeaf | null {
  const key = feature.properties?.key;
  if (typeof key !== "string" || feature.geometry.type !== "Point") return null;

  const [lon, lat] = feature.geometry.coordinates;
  return { key, lon, lat };
}

/**
 * A stack tap zooms to fit exactly its stores, which the list then shows
 * first; stores sharing one spot open as a list instead. A store tap selects it.
 */
export async function handleMapFeatureClick(
  event: MapLayerMouseEvent,
  mapRef: MapRef | null,
  { onSelect, onSameSpot, coveredBottom }: IMapClickActions,
) {
  const feature = event.features?.[0];
  if (!feature) return;

  const properties = feature.properties ?? {};

  if (properties.cluster_id == null || !feature.source) {
    if (typeof properties.key === "string") onSelect(properties.key);
    return;
  }

  const map = mapRef?.getMap();
  const source = map?.getSource(feature.source);
  if (!map || !(source instanceof maplibregl.GeoJSONSource)) return;

  const features = await source.getClusterLeaves(
    properties.cluster_id,
    Infinity,
    0,
  );
  const leaves = features.flatMap((leaf) => toLeaf(leaf) ?? []);
  if (leaves.length === 0) return;

  if (isSameSpot(leaves)) {
    onSameSpot({
      lon: leaves[0].lon,
      lat: leaves[0].lat,
      keys: leaves.map((leaf) => leaf.key),
    });
    return;
  }

  const { clientWidth, clientHeight } = map.getCanvas();

  map.fitBounds(leafBounds(leaves), {
    padding: fitPadding(clientWidth, clientHeight, coveredBottom),
    maxZoom: map.getMaxZoom(),
  });
}
