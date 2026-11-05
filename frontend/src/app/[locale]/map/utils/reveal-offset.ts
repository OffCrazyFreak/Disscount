interface ISpan {
  start: number;
  end: number;
}

/** Never so far that the row's header leaves the top. */
export function revealOffset(row: ISpan, view: ISpan): number | null {
  if (row.start < view.start) return row.start;

  if (row.end > view.end) {
    return Math.min(row.start, view.start + (row.end - view.end));
  }

  return null;
}
