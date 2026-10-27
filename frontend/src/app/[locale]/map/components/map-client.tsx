"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { useIsMobile } from "@/hooks/use-mobile";
import MapLoadState from "@/app/[locale]/map/components/map-load-state";
import MapMobileLayout from "@/app/[locale]/map/components/map-mobile-layout";
import MapPanel from "@/app/[locale]/map/components/map-panel";
import StoreMapLoader from "@/app/[locale]/map/components/store-map-loader";
import { useMapViewModel } from "@/app/[locale]/map/hooks/use-map-view-model";

import type { IIpLocation } from "@/app/[locale]/map/utils/ip-location";
import { IViewArea } from "@/app/[locale]/map/utils/view-area";

interface IMapClientProps {
  /** Cloudflare's guess from the IP, read on the server for this request. */
  ipLocation: IIpLocation | null;
}

/**
 * Desktop: list panel beside the map, filling the space between the header
 * and the footer so the page itself never scrolls.
 * Phone: full-screen map under a floating search bar that opens into the
 * list, with the selected store in a sheet above the bottom nav.
 */
export default function MapClient({ ipLocation }: IMapClientProps) {
  const t = useTranslations("map.layout");
  const model = useMapViewModel(ipLocation);
  const isMobile = useIsMobile();
  const [viewArea, setViewArea] = useState<IViewArea | null>(null);
  const [coveredShare, setCoveredShare] = useState(0);

  const map = (
    <StoreMapLoader
      stores={model.mappable}
      selected={model.selected}
      onSelect={model.selectStore}
      userLocation={model.geolocation.position}
      centerRequest={model.geolocation.centerRequest}
      initialView={model.initialView}
      coveredShare={isMobile ? coveredShare : 0}
      onViewChange={setViewArea}
    />
  );

  if (isMobile) {
    return (
      <MapMobileLayout
        model={model}
        viewArea={viewArea}
        map={map}
        onCoverChange={setCoveredShare}
      />
    );
  }

  // On desktop the map lines up with the footer box rather than the screen edge.
  // The server renders this branch on phones too, so until hydration swaps in
  // the phone layout it holds the phone's frame and shows nothing inside it.
  return (
    <div
      data-page-width="full"
      className="fixed inset-x-0 top-0 bottom-[var(--bottom-nav-total)] z-[1] md:static md:mx-auto md:min-h-0 md:w-full md:max-w-5xl md:flex-1"
    >
      <div className="mx-auto hidden h-full max-w-7xl grid-cols-[24rem_1fr] gap-4 md:grid">
        <aside
          id="map-store-list"
          aria-label={t("storeList")}
          className="flex min-h-0 flex-col overflow-hidden rounded-xl border bg-background"
        >
          {model.status === "success" ? (
            <MapPanel model={model} viewArea={viewArea} />
          ) : (
            <div className="flex min-h-0 flex-1 flex-col gap-3 p-3">
              <MapLoadState
                status={model.status}
                onRetry={() => model.retry()}
              />
            </div>
          )}
        </aside>

        <div className="overflow-hidden rounded-xl border">{map}</div>
      </div>
    </div>
  );
}
