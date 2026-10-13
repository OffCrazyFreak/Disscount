import type { ExpressionSpecification, StyleSpecification } from "maplibre-gl";

export const MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/positron";

// Fonts the OpenFreeMap style ships glyphs for; any other name renders no text.
export const MAP_FONT_BOLD = ["Noto Sans Bold"];

// OpenFreeMap prefers English names ("Zagreb" is fine, "Split" too, but
// islands and regions come out in English), so prefer the Croatian tag.
const CROATIAN_NAME: ExpressionSpecification = [
  "coalesce",
  ["get", "name:hr"],
  ["get", "name"],
];

/** Fetches the basemap style and makes its labels Croatian. */
export async function loadMapStyle(
  signal?: AbortSignal,
): Promise<StyleSpecification> {
  const response = await fetch(MAP_STYLE_URL, { signal });

  if (!response.ok) throw new Error(`Map style failed with ${response.status}`);

  const style = (await response.json()) as StyleSpecification;

  for (const layer of style.layers) {
    if (layer.type !== "symbol" || !layer.layout) continue;

    const field = JSON.stringify(layer.layout["text-field"] ?? "");

    if (field.includes('"name_en"')) {
      layer.layout["text-field"] = CROATIAN_NAME;
    }
  }

  return style;
}
