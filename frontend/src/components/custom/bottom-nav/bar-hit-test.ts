/** Past this, a press has left the bar, so releasing commits nothing */
const BAR_VERTICAL_SLOP_PX = 24;

/** By marker, so an index means the cell index whatever else renders in the list. */
export function navCells(bar: HTMLElement): HTMLElement[] {
  return [...bar.querySelectorAll<HTMLElement>("[data-nav-cell]")];
}

/** Measured from the cells so flexible gaps and pill padding resolve to their nearest cell. */
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
