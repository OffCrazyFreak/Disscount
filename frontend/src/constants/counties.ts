/**
 * The county each postal area serves, keyed by the first two postcode digits.
 * Area 10 covers both the City of Zagreb and Zagreb County, so it gets one
 * label for both.
 */
export const COUNTY_BY_POSTAL_AREA = {
  "10": "zagreb",
  "20": "dubrovnikNeretva",
  "21": "splitDalmatia",
  "22": "sibenikKnin",
  "23": "zadar",
  "31": "osijekBaranja",
  "32": "vukovarSrijem",
  "33": "viroviticaPodravina",
  "34": "pozegaSlavonia",
  "35": "brodPosavina",
  "40": "medimurje",
  "42": "varazdin",
  "43": "bjelovarBilogora",
  "44": "sisakMoslavina",
  "47": "karlovac",
  "48": "koprivnicaKrizevci",
  "49": "krapinaZagorje",
  "51": "primorjeGorskiKotar",
  "52": "istria",
  "53": "likaSenj",
} as const;

export type PostalArea = keyof typeof COUNTY_BY_POSTAL_AREA;

export type County = (typeof COUNTY_BY_POSTAL_AREA)[PostalArea];
