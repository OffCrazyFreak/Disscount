interface IListHeadingsInput {
  pinned: number;
  favorite: number;
  onMap: number;
  elsewhere: number;
  labels: {
    favorite: (count: number) => string;
    onMap: (count: number) => string;
    elsewhere: (count: number) => string;
    others: (count: number) => string;
  };
}

/**
 * Where each group of the store list starts, keyed by row index. Favourites
 * get their own group; the rest split into on-map and elsewhere only when the
 * map shows some stores but not all, and otherwise share one heading once a
 * favourites group sits above them.
 */
export function listHeadings({
  pinned,
  favorite,
  onMap,
  elsewhere,
  labels,
}: IListHeadingsInput): Map<number, string> | undefined {
  const headings = new Map<number, string>();
  const restStart = pinned + favorite;

  if (favorite > 0) headings.set(pinned, labels.favorite(favorite));

  if (onMap > 0 && elsewhere > 0) {
    headings.set(restStart, labels.onMap(onMap));
    headings.set(restStart + onMap, labels.elsewhere(elsewhere));
  } else if (favorite > 0 && onMap + elsewhere > 0) {
    headings.set(restStart, labels.others(onMap + elsewhere));
  }

  return headings.size > 0 ? headings : undefined;
}
