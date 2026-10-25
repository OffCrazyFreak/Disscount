"use client";

import { useEffect, useRef } from "react";
import { defaultRangeExtractor, useVirtualizer } from "@tanstack/react-virtual";
import { useTranslations } from "next-intl";

import StoreListItem from "@/app/[locale]/map/components/store-list-item";
import { IListedStore } from "@/app/[locale]/map/hooks/use-visible-stores";

interface IStoreListProps {
  rows: IListedStore[];
  /** Group labels, keyed by the index of the row each group starts at. */
  headings?: Map<number, string>;
  /** Changes when the map view reorders the rows. */
  orderKey: string;
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
}

// A closed row; open rows are measured.
const ROW_HEIGHT = 64;

/**
 * Every matching store, map or no map: this list is the accessible way in, so
 * keyboard and screen reader users never need the canvas. Virtualized, since
 * an unfiltered list is well over a thousand stores.
 */
export default function StoreList({
  rows,
  headings,
  orderKey,
  selectedKey,
  onSelect,
}: IStoreListProps) {
  // TanStack Virtual hands back functions the compiler cannot memoize safely;
  // opting out explicitly keeps the virtualized rows from going stale.
  "use no memo";

  const t = useTranslations("map.layout");
  const scrollRef = useRef<HTMLDivElement>(null);

  const selectedIndex = rows.findIndex((row) => row.key === selectedKey);

  // eslint-disable-next-line react-hooks/incompatible-library -- opted out above
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    // Measured heights follow the store, not the position, when filters change.
    getItemKey: (index) => rows[index].key,
    // The open row stays mounted, so focus on its actions survives scrolling.
    rangeExtractor: (range) => {
      const indexes = defaultRangeExtractor(range);
      return selectedIndex < 0 || indexes.includes(selectedIndex)
        ? indexes
        : [...indexes, selectedIndex].sort((a, b) => a - b);
    },
    overscan: 8,
  });

  // Set while a row is clicked; a pick made elsewhere (map, Back) moves focus.
  const pickedInList = useRef(false);
  const focusedKey = useRef<string | null>(null);

  // Opening a row collapses the one above it, and a filter can move the open
  // store, so the list brings the open row to the top whenever its position
  // changes. Focus moves only for a new pick, never while someone filters.
  useEffect(() => {
    const fromList = pickedInList.current;
    pickedInList.current = false;

    if (selectedIndex < 0) {
      focusedKey.current = null;
      return;
    }

    virtualizer.scrollToIndex(selectedIndex, { align: "start" });

    const isNewPick = focusedKey.current !== selectedKey;
    focusedKey.current = selectedKey;
    if (fromList || !isNewPick) return;

    requestAnimationFrame(() => {
      scrollRef.current
        ?.querySelector<HTMLElement>(
          `[data-store-key="${CSS.escape(rows[selectedIndex].key)}"]`,
        )
        ?.focus({ preventScroll: true });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKey, selectedIndex]);

  // A new view puts its stores on top, so show the top, unless a store is open
  // and the effect above already brought that row into view.
  useEffect(() => {
    if (selectedIndex < 0) virtualizer.scrollToOffset(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderKey]);

  function selectInList(key: string | null) {
    pickedInList.current = true;
    onSelect(key);
  }

  return (
    <div
      ref={scrollRef}
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
    >
      <ul
        aria-label={t("stores")}
        className="relative w-full"
        style={{ height: virtualizer.getTotalSize() }}
      >
        {virtualizer.getVirtualItems().map((item) => {
          const row = rows[item.index];
          const heading = headings?.get(item.index);

          return (
            <li
              key={row.key}
              ref={virtualizer.measureElement}
              data-index={item.index}
              aria-setsize={rows.length}
              aria-posinset={item.index + 1}
              className="absolute inset-x-0"
              style={{ transform: `translateY(${item.start}px)` }}
            >
              {heading && (
                <h2 className="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {heading}
                </h2>
              )}

              <StoreListItem
                row={row}
                isSelected={row.key === selectedKey}
                onSelect={selectInList}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
