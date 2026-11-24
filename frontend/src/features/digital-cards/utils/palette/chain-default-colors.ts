import { DEFAULT_CARD_COLOR } from "./card-palette";

const TOMATO = "#D50000";
const BLUEBERRY = "#3F51B5";
const BASIL = "#0B8043";
const TANGERINE = "#F4511E";
const BANANA = "#F6BF26";
const PEACOCK = "#039BE5";
const WISTERIA = "#B39DDB";

// Closest palette colour to each chain's logo, keyed by store-chain code.
export const CHAIN_DEFAULT_COLORS: Record<string, string> = {
  konzum: TOMATO,
  kaufland: TOMATO,
  plodine: TOMATO,
  tommy: TOMATO,
  ntl: TOMATO,
  ribola: TOMATO,
  stanic: TOMATO,
  djelo_vodice: TOMATO,
  gavranovic: TOMATO,
  lidl: BLUEBERRY,
  eurospin: BLUEBERRY,
  metro: BLUEBERRY,
  dm: BLUEBERRY,
  boso: BLUEBERRY,
  dukat: BLUEBERRY,
  stridon: BLUEBERRY,
  jadranka_trgovina: BLUEBERRY,
  spar: BASIL,
  ktc: BASIL,
  bure: BASIL,
  zabac: BASIL,
  studenac: TANGERINE,
  roto: BANANA,
  vrutak: BANANA,
  brodokomerc: PEACOCK,
  lorenco: PEACOCK,
  trgocentar: WISTERIA,
  branka: WISTERIA,
};

export function defaultColorForChain(chainCode: string | null) {
  return (chainCode && CHAIN_DEFAULT_COLORS[chainCode]) || DEFAULT_CARD_COLOR;
}
