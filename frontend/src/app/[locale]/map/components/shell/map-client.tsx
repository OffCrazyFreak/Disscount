"use client";

import { ReactNode, useState } from "react";

import StoreHoursProvider from "@/components/custom/store-hours/store-hours-context";
import MapLayout from "@/app/[locale]/map/components/shell/map-layout";
import StoreMapLoader from "@/app/[locale]/map/components/shell/store-map-loader";
import { useMapViewModel } from "@/app/[locale]/map/hooks/state/use-map-view-model";

import type { IIpLocation } from "@/app/[locale]/map/utils/location/ip-location";
import {
  IMapCover,
  IViewArea,
  NO_COVER,
} from "@/app/[locale]/map/utils/geometry/view-area";

interface IMapClientProps {
  /** Cloudflare's guess from the IP, read on the server for this request. */
  ipLocation: IIpLocation | null;
}

export default function MapClient({ ipLocation }: IMapClientProps) {
  const model = useMapViewModel(ipLocation);
  const [viewArea, setViewArea] = useState<IViewArea | null>(null);
  const [cover, setCover] = useState<IMapCover>(NO_COVER);

  function renderMap(overlay: ReactNode, onSelect: (key: string) => void) {
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
        cover={cover}
        onViewChange={setViewArea}
      >
        {overlay}
      </StoreMapLoader>
    );
  }

  return (
    <StoreHoursProvider hours={model.hours}>
      <MapLayout
        model={model}
        viewArea={viewArea}
        renderMap={renderMap}
        onCoverChange={setCover}
      />
    </StoreHoursProvider>
  );
}
