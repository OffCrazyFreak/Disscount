import { GEOAPIFY_ATTRIBUTION } from "@/lib/store-locations/geocoders/attribution";

// Store positions and town centres come partly from these sources; static strings only, because the control renders HTML.
export const MAP_CUSTOM_ATTRIBUTION = [
  '<a href="https://dgu.gov.hr/otvoreni-podaci/6596" target="_blank" rel="noopener noreferrer">Adrese: DGU</a>, sadrži informacije tijela javne vlasti u skladu s Otvorenom dozvolom',
  `<a href="${GEOAPIFY_ATTRIBUTION.url}" target="_blank" rel="noopener noreferrer">${GEOAPIFY_ATTRIBUTION.text}</a>`,
  // Town centres and counties rest on its postcodes, which CC BY 4.0 lets us bundle as long as GeoNames is credited.
  '<a href="https://www.geonames.org/" target="_blank" rel="noopener noreferrer">Poštanski brojevi: GeoNames</a> (<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>)',
];
