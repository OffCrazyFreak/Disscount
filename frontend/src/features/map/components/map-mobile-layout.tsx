"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import MapLoadState from "@/features/map/components/canvas/map-load-state";
import MapLocateButton from "@/features/map/components/map-locate-button";
import MapPanel from "@/features/map/components/map-panel";
import MapSearchBar from "@/features/map/components/search/map-search-bar";
import MapStoreSheet from "@/features/map/components/store/map-store-sheet";
import { IMapViewModel } from "@/features/map/hooks/use-map-view-model";
import { useNavClearance } from "@/features/map/hooks/layout/use-nav-clearance";
import { IViewArea } from "@/features/map/utils/view/view-area";

interface IMapMobileLayoutProps {
  model: IMapViewModel;
  viewArea: IViewArea | null;
  map: ReactNode;
  /** Pixels at the map's bottom the store sheet or the bottom nav covers. */
  onCoverChange: (height: number) => void;
}

export default function MapMobileLayout({
  model,
  viewArea,
  map,
  onCoverChange,
}: IMapMobileLayoutProps) {
  const t = useTranslations("map.layout");
  const locateRef = useRef<HTMLButtonElement>(null);
  const navProbeRef = useRef<HTMLDivElement>(null);
  const navHeight = useNavClearance(navProbeRef);
  const [sheetHeight, setSheetHeight] = useState(0);
  const [isSearchOpen, setSearchOpen] = useState(false);
  const sheetRow = isSearchOpen ? null : model.selected;

  function selectFromList(key: string | null) {
    model.selectStore(key);
    if (key) setSearchOpen(false);
  }

  // The map runs under the nav, so pins fitted with the sheet closed must still clear it.
  useEffect(() => {
    onCoverChange(Math.max(sheetHeight, navHeight));
  }, [sheetHeight, navHeight, onCoverChange]);

  return (
    <div data-page-width="full" className="fixed inset-0 z-[1] overflow-hidden">
      <div
        ref={navProbeRef}
        aria-hidden="true"
        className="pointer-events-none invisible absolute h-[var(--bottom-nav-total)] w-0"
      />

      {/* First in the DOM so the search comes before the map's controls in the tab order. */}
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
        onHeightChange={setSheetHeight}
        returnFocusRef={locateRef}
      />
    </div>
  );
}
