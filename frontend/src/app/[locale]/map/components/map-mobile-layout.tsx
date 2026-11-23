"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

import MapLocateButton from "@/app/[locale]/map/components/map-locate-button";
import MapPanel from "@/app/[locale]/map/components/map-panel";
import MapSearchBar from "@/app/[locale]/map/components/map-search-bar";
import MapStoreSheet from "@/app/[locale]/map/components/map-store-sheet";
import { IMapViewModel } from "@/app/[locale]/map/hooks/use-map-view-model";
import { useOffsetHeight } from "@/app/[locale]/map/hooks/use-offset-height";
import { IMapCover, IViewArea } from "@/app/[locale]/map/utils/view-area";

interface IMapMobileLayoutProps {
  model: IMapViewModel;
  viewArea: IViewArea | null;
  map: ReactNode;
  /** What the store sheet or the bottom nav covers of the map. */
  onCoverChange: (cover: IMapCover) => void;
}

export default function MapMobileLayout({
  model,
  viewArea,
  map,
  onCoverChange,
}: IMapMobileLayoutProps) {
  const locateRef = useRef<HTMLButtonElement>(null);
  const navProbeRef = useRef<HTMLDivElement>(null);
  const navHeight = useOffsetHeight(navProbeRef);
  const [sheetHeight, setSheetHeight] = useState(0);
  const [isSearchOpen, setSearchOpen] = useState(false);
  const sheetRow = isSearchOpen ? null : model.selected;

  function selectFromList(key: string | null) {
    model.selectStore(key);
    if (key) setSearchOpen(false);
  }

  // The map runs under the nav, so pins fitted with the sheet closed must still clear it.
  useEffect(() => {
    onCoverChange({ bottom: Math.max(sheetHeight, navHeight), right: 0 });
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
        <MapPanel
          model={{ ...model, selectStore: selectFromList }}
          viewArea={viewArea}
        />
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
