"use client";

import { ReactNode, useState } from "react";

import { useIsMobile } from "@/hooks/use-mobile";
import MapBottomSheet, {
  SheetSnap,
} from "@/app/map/components/map-bottom-sheet";
import MapLoadState from "@/app/map/components/map-load-state";
import MapPanel from "@/app/map/components/map-panel";
import StoreMapLoader from "@/app/map/components/store-map-loader";
import { useMapViewModel } from "@/app/map/hooks/use-map-view-model";

interface IMapClientProps {
  chainSummary: ReactNode;
}

/**
 * Desktop: list panel beside the map. Phone: full-screen map with the list in
 * a sheet. The layer sits between the floating header and the bottom nav, so
 * neither covers the map's controls.
 */
export default function MapClient({ chainSummary }: IMapClientProps) {
  const model = useMapViewModel();
  const isMobile = useIsMobile();
  const [snap, setSnap] = useState<SheetSnap>("half");

  function selectStore(key: string | null) {
    model.selectStore(key);
    if (key && snap === "peek") setSnap("half");
  }

  const panel =
    model.status === "success" ? (
      <MapPanel model={{ ...model, selectStore }} chainSummary={chainSummary} />
    ) : (
      <div className="flex min-h-0 flex-1 flex-col gap-3 p-3">
        <MapLoadState status={model.status} onRetry={() => model.retry()} />

        {/* Rendered before the list loads too, so the server HTML has it. */}
        {chainSummary}
      </div>
    );

  const map = (
    <StoreMapLoader
      stores={model.mappable}
      selected={model.selected}
      onSelect={selectStore}
      userLocation={model.geolocation.position}
      initialCenter={model.placeCenter}
    />
  );

  return (
    <div className="fixed inset-x-0 top-24 bottom-[var(--bottom-nav-total)] z-[1] md:bottom-0 md:px-4 md:pb-4">
      {isMobile ? (
        <div className="relative h-full overflow-hidden">
          <a
            href="#map-store-list"
            className="sr-only z-[3] rounded-md bg-background px-3 py-2 focus:not-sr-only focus:absolute focus:left-2 focus:top-2"
          >
            Preskoči kartu
          </a>

          <div className="absolute inset-0">{map}</div>

          <MapBottomSheet snap={snap} onSnapChange={setSnap}>
            <div id="map-store-list" className="flex min-h-0 flex-1 flex-col">
              {panel}
            </div>
          </MapBottomSheet>
        </div>
      ) : (
        <div className="mx-auto grid h-full max-w-7xl grid-cols-[24rem_1fr] gap-4">
          <aside
            id="map-store-list"
            aria-label="Popis trgovina"
            className="flex min-h-0 flex-col overflow-hidden rounded-xl border bg-background"
          >
            {panel}
          </aside>

          <div className="overflow-hidden rounded-xl border">{map}</div>
        </div>
      )}
    </div>
  );
}
