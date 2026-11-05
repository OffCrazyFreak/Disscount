import { IListedStore } from "@/app/[locale]/map/hooks/use-visible-stores";

export type IListEntry =
  | { kind: "heading"; key: string; label: string }
  | { kind: "store"; key: string; row: IListedStore };

/**
 * The rows with each group heading as its own entry, so assistive tech reads
 * a heading on its own instead of as part of the store after it.
 */
export function toListEntries(
  rows: IListedStore[],
  headings: Map<number, string> | undefined,
): IListEntry[] {
  return rows.flatMap((row, index): IListEntry[] => {
    const store: IListEntry = { kind: "store", key: row.key, row };
    const label = headings?.get(index);

    return label
      ? [{ kind: "heading", key: `heading:${index}`, label }, store]
      : [store];
  });
}
