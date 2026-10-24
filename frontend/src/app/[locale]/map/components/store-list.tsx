"use client";

import { useEffect, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
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

  // eslint-disable-next-line react-hooks/incompatible-library -- opted out above
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
  });

  // Set while a row is clicked, so only a pick made on the map scrolls the list.
  const pickedInList = useRef(false);

  useEffect(() => {
    if (pickedInList.current) {
      pickedInList.current = false;
      return;
    }

    const index = rows.findIndex((row) => row.key === selectedKey);
    if (index >= 0) virtualizer.scrollToIndex(index, { align: "start" });
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
