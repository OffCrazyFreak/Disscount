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
 * Which cell a point belongs to, measured from the cells themselves so the
 * flexible gaps and pill padding resolve to their nearest cell. A point that has
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

  let closestIndex = 0;
  let closestDistance = Number.POSITIVE_INFINITY;

  cells.forEach((cell, index) => {
    const rect = cell.getBoundingClientRect();
    const distance = Math.abs(x - (rect.left + rect.right) / 2);

    if (distance >= closestDistance) return;

    closestIndex = index;
    closestDistance = distance;
  });

  return closestIndex;
}
