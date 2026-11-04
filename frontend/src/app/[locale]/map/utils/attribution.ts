import type { Map as MapLibreMap } from "maplibre-gl";

// OpenStreetMap's guidelines let credits fold away after five seconds or the first pan or zoom, but not be hidden from the start.
const SHOW_FOR_MS = 5000;

/** MapLibre itself only folds the credits on a drag, not on a zoom or with time. */
export function foldAttributionLater(map: MapLibreMap) {
  function fold() {
    map
      .getContainer()
      .querySelector(".maplibregl-ctrl-attrib.maplibregl-compact")
      ?.classList.remove("maplibregl-compact-show");
  }

  // The credits fill in as sources load, so the clock starts once they have.
  map.once("idle", () => {
    const timer = window.setTimeout(fold, SHOW_FOR_MS);
    map.once("remove", () => window.clearTimeout(timer));
  });

  map.on("movestart", (event) => {
    if (event.originalEvent) fold();
  });
}
