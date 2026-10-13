import { GEOAPIFY_ATTRIBUTION } from "@/lib/store-locations/geocoders/attribution";

// Store positions come partly from these sources, so their credits ride in the
// map's attribution control beside the tile credits MapLibre adds itself.
// Static strings only: the control renders HTML.
export const MAP_CUSTOM_ATTRIBUTION = [
  '<a href="https://dgu.gov.hr/otvoreni-podaci/6596" target="_blank" rel="noopener noreferrer">Adrese: DGU</a>, sadrži informacije tijela javne vlasti u skladu s Otvorenom dozvolom',
  `<a href="${GEOAPIFY_ATTRIBUTION.url}" target="_blank" rel="noopener noreferrer">${GEOAPIFY_ATTRIBUTION.text}</a>`,
];
