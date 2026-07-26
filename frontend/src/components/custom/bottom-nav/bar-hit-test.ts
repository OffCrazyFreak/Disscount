/** Past this, a press has left the bar, so releasing commits nothing */
const BAR_VERTICAL_SLOP_PX = 24;

/**
 * The cells, by marker rather than by taking bar.children, so an index means the
 * cell index even if anything else ever renders inside the list.
 */
export function navCells(bar: HTMLElement): HTMLElement[] {
  return [...bar.querySelectorAll<HTMLElement>("[data-nav-cell]")];
}

/**
 * Which cell a point belongs to, measured from the cells themselves rather than
 * by dividing the bar's width, so the pill's own inner padding cannot skew the
 * boundaries. A point in that padding resolves to the nearest cell; one that has
 * left the bar vertically resolves to none.
 */
export default function indexFromPoint(
  bar: HTMLElement,
  x: number,
  y: number,
): number | null {
  const bounds = bar.getBoundingClientRect();

  if (y < bounds.top - BAR_VERTICAL_SLOP_PX) return null;
  if (y > bounds.bottom + BAR_VERTICAL_SLOP_PX) return null;

  const cells = navCells(bar);
  if (!cells.length) return null;

  const hit = cells.findIndex((cell) => {
    const rect = cell.getBoundingClientRect();

    return x >= rect.left && x <= rect.right;
  });

  if (hit !== -1) return hit;

  const firstLeft = cells[0].getBoundingClientRect().left;

  return x < firstLeft ? 0 : cells.length - 1;
}
