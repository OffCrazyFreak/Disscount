import * as maplibregl from "maplibre-gl";
import type { MapLayerMouseEvent, MapRef } from "react-map-gl/maplibre";

/** A cluster tap zooms in until it splits; a store tap selects that store. */
export async function handleMapFeatureClick(
  event: MapLayerMouseEvent,
  mapRef: MapRef | null,
  onSelect: (key: string) => void,
) {
  const feature = event.features?.[0];
  if (!feature) return;

  const properties = feature.properties ?? {};

  if (properties.cluster_id != null && feature.source) {
    const map = mapRef?.getMap();
    const source = map?.getSource(feature.source);

    if (map && source instanceof maplibregl.GeoJSONSource) {
      const zoom = await source.getClusterExpansionZoom(properties.cluster_id);
      map.easeTo({ center: event.lngLat, zoom });
    }

    return;
  }

  if (typeof properties.key === "string") onSelect(properties.key);
}
