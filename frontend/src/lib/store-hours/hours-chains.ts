import type { HoursSource } from "@/lib/api/schemas";

/**
 * Per-chain switch for showing hours, and the chain's own store finder that
 * the "Provjeri" link falls back to when a store has no page of its own.
 * Turning a chain off stops its refresh and hides the hours it already has,
 * which is how a chain's request to stop is honoured within one deploy.
 */
export const HOURS_CHAINS: Record<
  string,
  { enabled: boolean; finderUrl: string }
> = {
  boso: { enabled: true, finderUrl: "https://www.boso.hr/" },
  branka: { enabled: true, finderUrl: "https://www.branka.hr/" },
  dm: { enabled: true, finderUrl: "https://www.dm.hr/trgovine" },
  eurospin: {
    enabled: true,
    finderUrl: "https://www.eurospin.hr/nase-poslovnice/",
  },
  kaufland: {
    enabled: true,
    finderUrl: "https://www.kaufland.hr/usluge/pretraga-poslovnica.html",
  },
  konzum: { enabled: true, finderUrl: "https://trgovine.konzum.hr/" },
  ktc: { enabled: true, finderUrl: "https://www.ktc.hr/" },
  lidl: {
    enabled: true,
    finderUrl: "https://www.lidl.hr/s/hr-HR/trazilica-trgovina/",
  },
  ntl: { enabled: true, finderUrl: "https://www.ntl.hr/prodajna-mjesta" },
  plodine: { enabled: true, finderUrl: "https://www.plodine.hr/supermarketi" },
  ribola: { enabled: true, finderUrl: "https://www.ribola.hr/" },
  roto: { enabled: true, finderUrl: "https://www.roto-trgovina.hr/" },
  spar: { enabled: true, finderUrl: "https://www.spar.hr/lokacije" },
  stanic: { enabled: true, finderUrl: "https://www.stanic.hr/" },
  studenac: { enabled: true, finderUrl: "https://www.studenac.hr/trgovine" },
  tommy: { enabled: true, finderUrl: "https://www.tommy.hr/prodavaonice" },
  trgocentar: { enabled: true, finderUrl: "https://www.trgocentar.com/" },
  "trgovina-krk": {
    enabled: true,
    finderUrl: "https://www.trgovina-krk.hr/",
  },
};

// OpenStreetMap data is ODbL and not scraped from a chain, so it has its own
// switch and stays on for a chain whose own source is off.
const OSM_HOURS_ENABLED = true;

export function isHoursSourceEnabled(
  chain: string,
  source: HoursSource,
): boolean {
  return source === "osm"
    ? OSM_HOURS_ENABLED
    : (HOURS_CHAINS[chain]?.enabled ?? false);
}
