"use client";

import { ReactNode, useRef, useState } from "react";

import { useIsMobile } from "@/hooks/use-mobile";
import MapLocateButton from "@/app/[locale]/map/components/canvas/map-locate-button";
import MapPanel from "@/app/[locale]/map/components/search/map-panel";
import MapPresence from "@/app/[locale]/map/components/shell/map-presence";
import MapSearchBar from "@/app/[locale]/map/components/search/map-search-bar";
import MapStorePopover, {
  IFocusRequest,
} from "@/app/[locale]/map/components/store/map-store-popover";
import MapStoreSheet from "@/app/[locale]/map/components/store/map-store-sheet";
import { useMapCover } from "@/app/[locale]/map/hooks/layout/use-map-cover";
import {
  MapStatus,
  MapStatusContext,
} from "@/app/[locale]/map/hooks/layout/use-map-status";
import { IMapViewModel } from "@/app/[locale]/map/hooks/state/use-map-view-model";
import { IListedStore } from "@/app/[locale]/map/hooks/state/use-visible-stores";
import {
  IMapCover,
  IViewArea,
} from "@/app/[locale]/map/utils/geometry/view-area";

interface IMapLayoutProps {
  model: IMapViewModel;
  viewArea: IViewArea | null;
  /** The map, with an overlay rendered inside it and its pin picks sent to onSelect. */
  renderMap: (overlay: ReactNode, onSelect: (key: string) => void) => ReactNode;
  /** What the store sheet, the bottom nav or the search panel covers of the map. */
  onCoverChange: (cover: IMapCover) => void;
}

function hasPin(row: IListedStore | null | undefined) {
  return row?.store.lat != null && row.store.lon != null;
}

/** One full-screen map at every width; the picked store shows in a sheet on phones, at its pin on desktop. */
export default function MapLayout({
  model,
  viewArea,
  renderMap,
  onCoverChange,
}: IMapLayoutProps) {
  const isMobile = useIsMobile();
  const locateRef = useRef<HTMLButtonElement>(null);
  const [isSearchOpen, setSearchOpen] = useState(false);
  const [mapStatus, setMapStatus] = useState<MapStatus>("loading");
  const [focusRequest, setFocusRequest] = useState<IFocusRequest | null>(null);

  // Desktop shows a store at its pin, so one without a pin or a working map stays in the list; a loading map waits.
  const canShowAtPin = mapStatus !== "unavailable" && hasPin(model.selected);
  const keepsListOpen = !isMobile && model.selected != null && !canShowAtPin;
  const isOpen = isSearchOpen || keepsListOpen;
  const isPhoneSearchOpen = isMobile && isOpen;
  const shownRow = isOpen ? null : model.selected;

  function changeOpen(open: boolean) {
    setSearchOpen(open);
    if (!open && keepsListOpen) model.selectStore(null);
  }

  function selectStore(key: string | null) {
    model.selectStore(key);
    if (!key) return;

    setFocusRequest((previous) => ({ key, id: (previous?.id ?? 0) + 1 }));

    // Only the map's own pins can be missing from the list, and they all have one.
    const row = model.listed.find((listed) => listed.key === key);
    const willShowAtPin =
      mapStatus !== "unavailable" && (row ? hasPin(row) : true);
    if (isMobile || willShowAtPin) setSearchOpen(false);
  }

  const { setNavProbe, setPanel, setSheetHeight } = useMapCover({
    isMobile,
    isSearchOpen: isOpen,
    onCoverChange,
  });

  const overlay = (
    <>
      <MapPresence />

      {!isMobile && (
        <MapStorePopover
          row={shownRow}
          focusRequest={focusRequest}
          onClose={() => model.selectStore(null)}
          returnFocusRef={locateRef}
        />
      )}
    </>
  );

  return (
    // The phone's open search lifts the whole layer, since its own z-index only counts inside this one.
    <div
      className={`fixed inset-0 overflow-hidden ${isPhoneSearchOpen ? "z-[3]" : "z-[1]"}`}
    >
      <div
        ref={setNavProbe}
        aria-hidden="true"
        className="pointer-events-none invisible absolute h-[var(--bottom-nav-total)] w-0"
      />

      {/* First in the DOM so the search comes before the map's controls in the tab order. */}
      <MapSearchBar
        // Remounted at the breakpoint, where its field moves between the header and the map.
        key={isMobile ? "phone" : "desktop"}
        isOpen={isOpen}
        onOpenChange={changeOpen}
        panelRef={setPanel}
      >
        <MapPanel model={{ ...model, selectStore }} viewArea={viewArea} />
      </MapSearchBar>

      {/* On phones the open search covers the whole map, so the map leaves the tab order. */}
      <div className="absolute inset-0" inert={isPhoneSearchOpen}>
        <MapStatusContext value={setMapStatus}>
          {renderMap(overlay, selectStore)}
        </MapStatusContext>

        <MapLocateButton
          ref={locateRef}
          status={model.geolocation.status}
          onLocate={model.geolocation.locate}
        />
      </div>

      {isMobile && (
        <MapStoreSheet
          row={shownRow}
          onClose={() => model.selectStore(null)}
          onHeightChange={setSheetHeight}
          returnFocusRef={locateRef}
        />
      )}
    </div>
  );
}
