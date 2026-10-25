"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import StoreList from "@/app/[locale]/map/components/store-list";
import { useHeldView } from "@/app/[locale]/map/hooks/use-held-view";
import { IListedStore } from "@/app/[locale]/map/hooks/use-visible-stores";
import { IViewArea, splitByView } from "@/app/[locale]/map/utils/view-area";

interface IViewSortedListProps {
  /** Rows shown first whatever the map shows (a store a shared link opened). */
  pinned: IListedStore[];
  listed: IListedStore[];
  viewArea: IViewArea | null;
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
}

/** The store list with the stores on the visible map grouped on top. */
export default function ViewSortedList({
  pinned,
  listed,
  viewArea,
  selectedKey,
  onSelect,
}: IViewSortedListProps) {
  const t = useTranslations("map.list");
  const view = useHeldView(viewArea);
  const [focusRequest, setFocusRequest] = useState(0);

  const { onMap, elsewhere } = splitByView(listed, view.applied);

  // Groups only help when the map shows some stores but not all of them.
  const grouped = onMap.length > 0 && elsewhere.length > 0;
  const headings = grouped
    ? new Map([
        [pinned.length, t("onMap", { count: onMap.length })],
        [
          pinned.length + onMap.length,
          t("elsewhere", { count: elsewhere.length }),
        ],
      ])
    : undefined;

  // The chip unmounts once pressed, so the list takes focus instead of it
  // dropping to the page.
  function applyView() {
    view.apply();
    setFocusRequest((count) => count + 1);
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col" {...view.holdProps}>
      {view.pending && (
        <button
          type="button"
          onClick={applyView}
          className="absolute inset-x-0 top-2 z-10 mx-auto w-fit rounded-full bg-foreground px-3 py-1.5 text-xs font-medium text-background shadow-md hover:bg-foreground/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {t("update")}
        </button>
      )}

      <p role="status" className="sr-only">
        {view.applied && t("onMapStatus", { count: onMap.length })}
      </p>

      <StoreList
        rows={[...pinned, ...onMap, ...elsewhere]}
        headings={headings}
        orderKey={onMap.map((row) => row.key).join()}
        focusRequest={focusRequest}
        selectedKey={selectedKey}
        onSelect={onSelect}
      />
    </div>
  );
}
