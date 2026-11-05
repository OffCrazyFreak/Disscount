// Google Calendar's colours, laid out as a 19-cell colour wheel: red at the top running
// clockwise, lighter tones on the inner ring. Near-twins (Citron, Pumpkin, Cobalt) were
// left out so no two cells read as the same colour. Amethyst is darkened from #9E69AF,
// which reached only 4.3:1 with either text colour. card-palette.test.ts holds every
// colour to 4.5:1 against its text colour.

export type PaletteColorId =
  | "graphite"
  | "cherryBlossom"
  | "flamingo"
  | "mango"
  | "avocado"
  | "peacock"
  | "lavender"
  | "radicchio"
  | "tomato"
  | "tangerine"
  | "banana"
  | "pistachio"
  | "basil"
  | "sage"
  | "eucalyptus"
  | "blueberry"
  | "wisteria"
  | "amethyst"
  | "grape";

export interface ICardPaletteColor {
  hex: string;
  /** Key under digitalCards.colors: the name (as Google calls it) and a plain hue for screen readers. */
  id: PaletteColorId;
  ring: 0 | 1 | 2;
  /** Degrees, 0 = right, increasing clockwise on screen. */
  angle: number;
}

export const CARD_PALETTE: readonly ICardPaletteColor[] = [
  { hex: "#616161", id: "graphite", ring: 0, angle: 0 },
  {
    hex: "#D81B60",
    id: "cherryBlossom",
    ring: 1,
    angle: 240,
  },
  {
    hex: "#E67C73",
    id: "flamingo",
    ring: 1,
    angle: 300,
  },
  { hex: "#F09300", id: "mango", ring: 1, angle: 0 },
  { hex: "#C0CA33", id: "avocado", ring: 1, angle: 60 },
  { hex: "#039BE5", id: "peacock", ring: 1, angle: 120 },
  {
    hex: "#7986CB",
    id: "lavender",
    ring: 1,
    angle: 180,
  },
  { hex: "#AD1457", id: "radicchio", ring: 2, angle: 270 },
  { hex: "#D50000", id: "tomato", ring: 2, angle: 300 },
  {
    hex: "#F4511E",
    id: "tangerine",
    ring: 2,
    angle: 330,
  },
  { hex: "#F6BF26", id: "banana", ring: 2, angle: 0 },
  {
    hex: "#7CB342",
    id: "pistachio",
    ring: 2,
    angle: 30,
  },
  { hex: "#0B8043", id: "basil", ring: 2, angle: 60 },
  { hex: "#33B679", id: "sage", ring: 2, angle: 90 },
  { hex: "#009688", id: "eucalyptus", ring: 2, angle: 120 },
  { hex: "#3F51B5", id: "blueberry", ring: 2, angle: 150 },
  {
    hex: "#B39DDB",
    id: "wisteria",
    ring: 2,
    angle: 180,
  },
  { hex: "#985FAA", id: "amethyst", ring: 2, angle: 210 },
  {
    hex: "#8E24AA",
    id: "grape",
    ring: 2,
    angle: 240,
  },
];

export const DEFAULT_CARD_COLOR = "#616161";

export function findPaletteColor(hex: string) {
  return CARD_PALETTE.find(
    (color) => color.hex.toLowerCase() === hex.toLowerCase(),
  );
}
