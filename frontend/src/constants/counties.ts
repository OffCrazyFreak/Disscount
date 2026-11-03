/** Each county by its GeoNames code, the one `postcode-counties.json` stores. */
export const COUNTY_BY_GEONAMES_CODE = {
  "01": "bjelovarBilogora",
  "02": "brodPosavina",
  "03": "dubrovnikNeretva",
  "04": "istria",
  "05": "karlovac",
  "06": "koprivnicaKrizevci",
  "07": "krapinaZagorje",
  "08": "likaSenj",
  "09": "medimurje",
  "10": "osijekBaranja",
  "11": "pozegaSlavonia",
  "12": "primorjeGorskiKotar",
  "13": "sibenikKnin",
  "14": "sisakMoslavina",
  "15": "splitDalmatia",
  "16": "varazdin",
  "17": "viroviticaPodravina",
  "18": "vukovarSrijem",
  "19": "zadar",
  "20": "zagrebCounty",
  "21": "cityOfZagreb",
} as const;

type GeoNamesCountyCode = keyof typeof COUNTY_BY_GEONAMES_CODE;

export type County = (typeof COUNTY_BY_GEONAMES_CODE)[GeoNamesCountyCode];

export function isGeoNamesCountyCode(code: string): code is GeoNamesCountyCode {
  return code in COUNTY_BY_GEONAMES_CODE;
}
