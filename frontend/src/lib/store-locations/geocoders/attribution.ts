// Wording follows each service's terms: Geoapify's free plan requires a
// follow link, and OSM data (ODbL) always requires crediting contributors.
export const GEOAPIFY_ATTRIBUTION = {
  text: "Powered by Geoapify",
  url: "https://www.geoapify.com/",
};

export const OPENSTREETMAP_ATTRIBUTION = {
  text: "© OpenStreetMap contributors",
  url: "https://www.openstreetmap.org/copyright",
};

export const NOMINATIM_ATTRIBUTION = {
  text: "Geocoding by Nominatim, data © OpenStreetMap contributors (ODbL)",
  url: "https://www.openstreetmap.org/copyright",
};

/** Geoapify results are OSM based, so both credits are shown together. */
export const GEOAPIFY_ATTRIBUTIONS = [
  GEOAPIFY_ATTRIBUTION,
  OPENSTREETMAP_ATTRIBUTION,
];
