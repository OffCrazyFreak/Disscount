"use client";

import { ReactNode, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import MapLoadState from "@/app/[locale]/map/components/map-load-state";
import MapLocateButton from "@/app/[locale]/map/components/map-locate-button";
import MapPanel from "@/app/[locale]/map/components/map-panel";
import MapSearchBar from "@/app/[locale]/map/components/map-search-bar";
import MapStoreSheet from "@/app/[locale]/map/components/map-store-sheet";
import { IMapViewModel } from "@/app/[locale]/map/hooks/use-map-view-model";
import { IViewArea } from "@/app/[locale]/map/utils/view-area";

interface IMapMobileLayoutProps {
  model: IMapViewModel;
  viewArea: IViewArea | null;
  map: ReactNode;
  /** Share of the map's height the store sheet covers. */
  onCoverChange: (share: number) => void;
}

/**
 * The phone map: full screen under a floating bar whose search opens into the
 * list. Picking a store closes the list and shows it in a sheet.
 */
export default function MapMobileLayout({
  model,
  viewArea,
  map,
  onCoverChange,
}: IMapMobileLayoutProps) {
  const t = useTranslations("map.layout");
  const containerRef = useRef<HTMLDivElement>(null);
  const locateRef = useRef<HTMLButtonElement>(null);
  const [isSearchOpen, setSearchOpen] = useState(false);
  const sheetRow = isSearchOpen ? null : model.selected;

  function selectFromList(key: string | null) {
    model.selectStore(key);
    if (key) setSearchOpen(false);
  }

  function reportSheetHeight(height: number) {
    const mapHeight = containerRef.current?.clientHeight ?? 0;
    onCoverChange(mapHeight > 0 ? Math.min(height / mapHeight, 1) : 0);
  }

  return (
    <div
      ref={containerRef}
      data-page-width="full"
      className="fixed inset-x-0 top-0 bottom-[var(--bottom-nav-total)] z-[1] overflow-hidden"
    >
      {/* First in the DOM so the search comes before the map's controls in
          the tab order, the way the list did before it. */}
      <MapSearchBar isOpen={isSearchOpen} onOpenChange={setSearchOpen}>
        <section
          id="map-store-list"
          aria-label={t("storeList")}
          className="flex min-h-0 flex-1 flex-col"
        >
          {model.status === "success" ? (
            <MapPanel
              model={{ ...model, selectStore: selectFromList }}
              viewArea={viewArea}
              withSearch={false}
            />
          ) : (
            <div className="flex min-h-0 flex-1 flex-col gap-3 p-3">
              <MapLoadState
                status={model.status}
                onRetry={() => model.retry()}
              />
            </div>
          )}
        </section>
      </MapSearchBar>

      <div className="absolute inset-0" inert={isSearchOpen}>
        {map}

        <MapLocateButton
          ref={locateRef}
          status={model.geolocation.status}
          onLocate={model.geolocation.locate}
        />
      </div>

      <MapStoreSheet
        row={sheetRow}
        onClose={() => model.selectStore(null)}
        onHeightChange={reportSheetHeight}
        returnFocusRef={locateRef}
      />
    </div>
  );
}
