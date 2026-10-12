// Google Calendar's colours, laid out as a 19-cell colour wheel: red at the top running
// clockwise, lighter tones on the inner ring. Near-twins (Citron, Pumpkin, Cobalt) were
// left out so no two cells read as the same colour. Amethyst is darkened from #9E69AF,
// which reached only 4.3:1 with either text colour. card-palette.test.ts holds every
// colour to 4.5:1 against its text colour.

export interface ICardPaletteColor {
  hex: string;
  /** Visible name, as Google calls it, in Croatian. */
  name: string;
  /** Plain hue appended for screen readers, since "Borovnica" alone says nothing. */
  hue: string;
  ring: 0 | 1 | 2;
  /** Degrees, 0 = right, increasing clockwise on screen. */
  angle: number;
}

export const CARD_PALETTE: readonly ICardPaletteColor[] = [
  { hex: "#616161", name: "Grafit", hue: "siva", ring: 0, angle: 0 },
  {
    hex: "#D81B60",
    name: "Trešnjin cvijet",
    hue: "ružičasta",
    ring: 1,
    angle: 240,
  },
  {
    hex: "#E67C73",
    name: "Flamingo",
    hue: "svijetlocrvena",
    ring: 1,
    angle: 300,
  },
  { hex: "#F09300", name: "Mango", hue: "narančasta", ring: 1, angle: 0 },
  { hex: "#C0CA33", name: "Avokado", hue: "žutozelena", ring: 1, angle: 60 },
  { hex: "#039BE5", name: "Paun", hue: "svijetloplava", ring: 1, angle: 120 },
  {
    hex: "#7986CB",
    name: "Lavanda",
    hue: "plavoljubičasta",
    ring: 1,
    angle: 180,
  },
  { hex: "#AD1457", name: "Radič", hue: "tamnoružičasta", ring: 2, angle: 270 },
  { hex: "#D50000", name: "Rajčica", hue: "crvena", ring: 2, angle: 300 },
  {
    hex: "#F4511E",
    name: "Mandarina",
    hue: "crvenonarančasta",
    ring: 2,
    angle: 330,
  },
  { hex: "#F6BF26", name: "Banana", hue: "žuta", ring: 2, angle: 0 },
  {
    hex: "#7CB342",
    name: "Pistacija",
    hue: "svijetlozelena",
    ring: 2,
    angle: 30,
  },
  { hex: "#0B8043", name: "Bosiljak", hue: "tamnozelena", ring: 2, angle: 60 },
  { hex: "#33B679", name: "Kadulja", hue: "zelena", ring: 2, angle: 90 },
  { hex: "#009688", name: "Eukaliptus", hue: "tirkizna", ring: 2, angle: 120 },
  { hex: "#3F51B5", name: "Borovnica", hue: "tamnoplava", ring: 2, angle: 150 },
  {
    hex: "#B39DDB",
    name: "Glicinija",
    hue: "svijetloljubičasta",
    ring: 2,
    angle: 180,
  },
  { hex: "#985FAA", name: "Ametist", hue: "ljubičasta", ring: 2, angle: 210 },
  {
    hex: "#8E24AA",
    name: "Grožđe",
    hue: "tamnoljubičasta",
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
