import { CARD_PALETTE } from "../../../utils/card-palette";
import { hexCell } from "../../../utils/hex-grid";

// Dark enough to vanish on a near-black modal, so dark mode draws an outline on them.
const DARK_CELLS = new Set([
  "#616161",
  "#0B8043",
  "#3F51B5",
  "#8E24AA",
  "#AD1457",
]);

export const PICKER_CELLS = CARD_PALETTE.map((color) => ({
  color,
  ...hexCell(color.ring, color.angle),
  needsDarkOutline: DARK_CELLS.has(color.hex),
}));

export const PICKER_WIDTH = 300;
export const PICKER_HEIGHT = 230;
export const CELL_WIDTH = 44;
export const CELL_HEIGHT = 51;
