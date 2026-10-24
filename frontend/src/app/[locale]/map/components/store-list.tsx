"use client";

import { useEffect, useRef } from "react";
import { defaultRangeExtractor, useVirtualizer } from "@tanstack/react-virtual";
import { useTranslations } from "next-intl";

import StoreListItem from "@/app/[locale]/map/components/store-list-item";
import { IListedStore } from "@/app/[locale]/map/hooks/use-visible-stores";

interface IStoreListProps {
  rows: IListedStore[];
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

  // Opening a row collapses the one above it, so the list always brings the
  // open row to the top rather than leaving it wherever it slid to.
  useEffect(() => {
    const fromList = pickedInList.current;
    pickedInList.current = false;
    if (selectedIndex < 0) return;

    virtualizer.scrollToIndex(selectedIndex, { align: "start" });
    if (fromList) return;

    requestAnimationFrame(() => {
      scrollRef.current
        ?.querySelector<HTMLElement>(
          `[data-store-key="${CSS.escape(rows[selectedIndex].key)}"]`,
        )
        ?.focus({ preventScroll: true });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKey]);

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
