const HEX_PITCH = 44;
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
function axialFor(ring: number, angle: number) {
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

function readingOrder(cells: readonly IHexCell[]) {
  return cells
    .map((_, index) => index)
    .sort((a, b) => cells[a].r - cells[b].r || cells[a].x - cells[b].x);
}

function nearestInRow(
  cells: readonly IHexCell[],
  row: number,
  x: number,
  preferRight: boolean,
) {
  let best = -1;

  cells.forEach((cell, index) => {
    if (cell.r !== row) return;
    if (best === -1) {
      best = index;
      return;
    }

    // Wrapped rows can sit half a pitch off, so ties break toward the direction of travel.
    const gap = Math.abs(cell.x - x) - Math.abs(cells[best].x - x);
    const closerSide = preferRight
      ? cell.x > cells[best].x
      : cell.x < cells[best].x;
    if (gap < 0 || (gap === 0 && closerSide)) best = index;
  });

  return best;
}

function cellAt(cells: readonly IHexCell[], q: number, r: number) {
  return cells.findIndex((cell) => cell.q === q && cell.r === r);
}

// Up goes upper-left and Down goes lower-right, so the two undo each other.
function verticalIndex(
  cells: readonly IHexCell[],
  currentIndex: number,
  down: boolean,
) {
  const { q, r, x } = cells[currentIndex];
  const dr = down ? 1 : -1;
  const primary = cellAt(cells, q, r + dr);
  const secondary = cellAt(cells, down ? q - 1 : q + 1, r + dr);

  if (primary !== -1) return primary;
  if (secondary !== -1) return secondary;

  const rows = cells.map((cell) => cell.r);
  const hasRow = rows.includes(r + dr);
  const target = hasRow ? r + dr : down ? Math.min(...rows) : Math.max(...rows);

  return nearestInRow(cells, target, x + (down ? 22 : -22), down);
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
    case "ArrowDown":
      return verticalIndex(cells, currentIndex, key === "ArrowDown");
    default:
      return currentIndex;
  }
}
