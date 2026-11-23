"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { useIsMobile } from "@/hooks/use-mobile";
import StoreHoursProvider from "@/components/custom/store-hours/store-hours-context";
import MapLoadState from "@/features/map/components/canvas/map-load-state";
import MapMobileLayout from "@/features/map/components/map-mobile-layout";
import MapPanel from "@/features/map/components/map-panel";
import StoreMapLoader from "@/features/map/components/canvas/store-map-loader";
import { useMapViewModel } from "@/features/map/hooks/use-map-view-model";

import type { IIpLocation } from "@/features/map/utils/view/ip-location";
import { IViewArea } from "@/features/map/utils/view/view-area";

interface IMapClientProps {
  /** Cloudflare's guess from the IP, read on the server for this request. */
  ipLocation: IIpLocation | null;
}

export default function MapClient({ ipLocation }: IMapClientProps) {
  const t = useTranslations("map.layout");
  const model = useMapViewModel(ipLocation);
  const isMobile = useIsMobile();
  const [viewArea, setViewArea] = useState<IViewArea | null>(null);
  const [coveredHeight, setCoveredHeight] = useState(0);

  const map = (
    <StoreMapLoader
      stores={model.mappable}
      selected={model.selected}
      onSelect={model.selectStore}
      userLocation={
        model.geolocation.position ??
        (model.geolocation.guess && {
          ...model.geolocation.guess,
          approximate: true,
        })
      }
      centerRequest={model.geolocation.centerRequest}
      initialView={model.initialView}
      coveredHeight={isMobile ? coveredHeight : 0}
      onViewChange={setViewArea}
    />
  );

  if (isMobile) {
    return (
      <StoreHoursProvider hours={model.hours}>
        <MapMobileLayout
          model={model}
          viewArea={viewArea}
          map={map}
          onCoverChange={setCoveredHeight}
        />
      </StoreHoursProvider>
    );
  }

  // The server renders this on phones too, so until hydration it holds the phone's empty frame.
  return (
    <StoreHoursProvider hours={model.hours}>
      <div
        data-page-width="full"
        className="fixed inset-0 z-[1] md:static md:mx-auto md:min-h-0 md:w-full md:max-w-5xl md:flex-1"
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
    </StoreHoursProvider>
  );
}
