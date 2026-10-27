"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import StoreList from "@/app/[locale]/map/components/store-list";
import { useHeldView } from "@/app/[locale]/map/hooks/use-held-view";
import { useFavoriteStores } from "@/app/[locale]/map/hooks/use-favorite-stores";
import { IListedStore } from "@/app/[locale]/map/hooks/use-visible-stores";
import { IViewArea, splitByView } from "@/app/[locale]/map/utils/view-area";
import { listHeadings } from "@/app/[locale]/map/utils/list-headings";

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
  const favorites = useFavoriteStores();

  const favorite = listed.filter((row) => favorites.isFavorite(row.key));
  const rest = listed.filter((row) => !favorites.isFavorite(row.key));
  const { onMap, elsewhere } = splitByView(rest, view.applied);

  const headings = listHeadings({
    pinned: pinned.length,
    favorite: favorite.length,
    onMap: onMap.length,
    elsewhere: elsewhere.length,
    labels: {
      favorite: (count) => t("favorites", { count }),
      onMap: (count) => t("onMap", { count }),
      elsewhere: (count) => t("elsewhere", { count }),
      others: (count) => t("others", { count }),
    },
  });

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
        rows={[...pinned, ...favorite, ...onMap, ...elsewhere]}
        headings={headings}
        orderKey={[...favorite, ...onMap].map((row) => row.key).join()}
        focusRequest={focusRequest}
        selectedKey={selectedKey}
        onSelect={onSelect}
      />
    </div>
  );
}
