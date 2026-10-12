export const HEX_PITCH = 44;
export const HEX_ROW_HEIGHT = 38;

export interface IHexCell {
  q: number;
  r: number;
  x: number;
  y: number;
}

// Axial steps for angles 0, 60, ... 300 (0 = right, clockwise on screen, pointy-top).
const DIRECTIONS = [
  { q: 1, r: 0 },
  { q: 0, r: 1 },
  { q: -1, r: 1 },
  { q: -1, r: 0 },
  { q: 0, r: -1 },
  { q: 1, r: -1 },
];

/** Axial coordinates of a cell on a hexagonal ring, where multiples of 60 degrees are corners. */
export function axialFor(ring: number, angle: number) {
  if (ring === 0) return { q: 0, r: 0 };

  const index = Math.floor(angle / 60) % 6;
  const first = DIRECTIONS[index];

  if (angle % 60 === 0) return { q: first.q * ring, r: first.r * ring };

  // Ring 2 edge midpoints sit between two corners, so sum the neighbouring directions.
  const second = DIRECTIONS[(index + 1) % 6];
  return { q: first.q + second.q, r: first.r + second.r };
}

export function hexCell(ring: number, angle: number): IHexCell {
  const { q, r } = axialFor(ring, angle);

  return { q, r, x: HEX_PITCH * (q + r / 2), y: HEX_ROW_HEIGHT * r };
}

export type HexNavigationKey =
  "ArrowLeft" | "ArrowRight" | "ArrowUp" | "ArrowDown" | "Home" | "End";

function readingOrder(cells: readonly IHexCell[]) {
  return cells
    .map((_, index) => index)
    .sort((a, b) => cells[a].r - cells[b].r || cells[a].x - cells[b].x);
}

function nearestInRow(cells: readonly IHexCell[], row: number, x: number) {
  let best = -1;

  cells.forEach((cell, index) => {
    if (cell.r !== row) return;
    if (best === -1) {
      best = index;
      return;
    }

    // Adjacent rows are offset by half a pitch, so ties are normal: take the left cell.
    const gap = Math.abs(cell.x - x) - Math.abs(cells[best].x - x);
    if (gap < 0 || (gap === 0 && cell.x < cells[best].x)) best = index;
  });

  return best;
}

/** Index of the cell that should receive focus after `key`, or the current one for other keys. */
export function nextCellIndex(
  cells: readonly IHexCell[],
  currentIndex: number,
  key: string,
) {
  const order = readingOrder(cells);
  const position = order.indexOf(currentIndex);

  switch (key) {
    case "ArrowLeft":
      return order[(position - 1 + order.length) % order.length];
    case "ArrowRight":
      return order[(position + 1) % order.length];
    case "Home":
      return order[0];
    case "End":
      return order[order.length - 1];
    case "ArrowUp":
    case "ArrowDown": {
      const rows = [...new Set(cells.map((cell) => cell.r))].sort(
        (a, b) => a - b,
      );
      const rowIndex = rows.indexOf(cells[currentIndex].r);
      const step = key === "ArrowUp" ? -1 : 1;
      const target = rows[(rowIndex + step + rows.length) % rows.length];

      return nearestInRow(cells, target, cells[currentIndex].x);
    }
    default:
      return currentIndex;
  }
}
