interface ISpan {
  start: number;
  end: number;
}

/**
 * Where to scroll so a whole opened row shows, moving the least, and never so
 * far that its header leaves the top. Null when it already fits.
 */
export function revealOffset(row: ISpan, view: ISpan): number | null {
  if (row.start < view.start) return row.start;

  if (row.end > view.end) {
    return Math.min(row.start, view.start + (row.end - view.end));
  }

  return null;
}
