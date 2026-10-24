import { normalizeForSearch } from "@/utils/strings";

// cijene-api gives Stanić stores a code and a city only, and diskont.hr has
// no codes, so this pairs them by hand: each code's name comes from the
// upstream price file name ("MP_131_DISKONT ŽITNJAK 1_<date>.xlsx"), checked
// against the diskont.hr store with that name or street and, where it lists
// the code, catalog.hr's Stanić branch list. 1301 is a mobile shop. Once
// upstream publishes Stanić street addresses, address matching makes this
// table unnecessary.
const CODE_BY_STORE_NAME: Record<string, string> = {
  "Zagreb Žitnjak": "131",
  "Zagreb Veletržnica": "133",
  // File name "SAMOBORSKA": the Stenjevec store is at Samoborska cesta 91.
  "Zagreb Stenjevec": "134",
  "Zagreb Dubrava": "146",
  Grabovac: "136",
  Karlovac: "140",
  Koprivnica: "147",
  Bjelovar: "149",
  Čakovec: "164",
  Sesvete: "165",
  Opatija: "431",
  Rijeka: "432",
  "Slavonski Brod": "533",
  Vinkovci: "536",
  Požega: "538",
  Medulin: "7302",
  Rovinj: "7307",
  Labin: "7308",
  // "PULA" and "PULA 4" upstream; catalog.hr puts 734 at Bože Gumpca 34 and
  // 739 at Rizzijeva 59, the addresses of diskont.hr's "Pula" and "Pula 2".
  Pula: "734",
  "Pula 2": "739",
  Poreč: "731",
  Vodnjan: "732",
  Umag: "733",
  "Stari Grad": "8301",
  Trogir: "8303",
  "Kaštel Gomilica": "8307",
  Šibenik: "837",
  Dubrovnik: "863",
  Vodice: "932",
  Zadar: "933",
  Biograd: "935",
};

// diskont.hr titles read "Diskont Stanić Zagreb &#8211; Žitnjak".
function nameKey(name: string): string {
  return normalizeForSearch(name.replace(/&#?\w+;/g, " "))
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/^\s*diskont stanic\b/, "")
    .replace(/\s+/g, " ")
    .trim();
}

const CODES = new Map(
  Object.entries(CODE_BY_STORE_NAME).map(([name, code]) => [
    nameKey(name),
    code,
  ]),
);

/** The cijene-api code for a diskont.hr store title, if the table knows it. */
export function stanicCodeFor(storeTitle: string): string | undefined {
  return CODES.get(nameKey(storeTitle));
}

/** Two stores under one title would make the code a guess, so neither keeps it. */
export function dropSharedCodes<T extends { code?: string }>(stores: T[]): T[] {
  return stores.map((store) =>
    store.code && stores.filter((other) => other.code === store.code).length > 1
      ? { ...store, code: undefined }
      : store,
  );
}
