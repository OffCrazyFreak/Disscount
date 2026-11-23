"use client";

import { ReactNode, useState } from "react";

import { useIsMobile } from "@/hooks/use-mobile";
import StoreHoursProvider from "@/components/custom/store-hours/store-hours-context";
import MapDesktopLayout from "@/app/[locale]/map/components/map-desktop-layout";
import MapMobileLayout from "@/app/[locale]/map/components/map-mobile-layout";
import StoreMapLoader from "@/app/[locale]/map/components/store-map-loader";
import { useMapViewModel } from "@/app/[locale]/map/hooks/use-map-view-model";

import type { IIpLocation } from "@/app/[locale]/map/utils/ip-location";
import { IViewArea } from "@/app/[locale]/map/utils/view-area";

interface IMapClientProps {
  /** Cloudflare's guess from the IP, read on the server for this request. */
  ipLocation: IIpLocation | null;
}

export default function MapClient({ ipLocation }: IMapClientProps) {
  const model = useMapViewModel(ipLocation);
  const isMobile = useIsMobile();
  const [viewArea, setViewArea] = useState<IViewArea | null>(null);
  const [coveredHeight, setCoveredHeight] = useState(0);

  function renderMap(
    overlay?: ReactNode,
    onSelect: (key: string) => void = model.selectStore,
  ) {
    return (
      <StoreMapLoader
        stores={model.mappable}
        selected={model.selected}
        onSelect={onSelect}
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
      >
        {overlay}
      </StoreMapLoader>
    );
  }

  return (
    <StoreHoursProvider hours={model.hours}>
      {isMobile ? (
        <MapMobileLayout
          model={model}
          viewArea={viewArea}
          map={renderMap()}
          onCoverChange={setCoveredHeight}
        />
      ) : (
        <MapDesktopLayout
          model={model}
          viewArea={viewArea}
          renderMap={renderMap}
        />
      )}
    </StoreHoursProvider>
  );
}
