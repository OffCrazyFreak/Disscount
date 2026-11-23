"use client";

import { createContext, useContext, useEffect } from "react";

export type MapStatus = "loading" | "live" | "unavailable";

/** Provided by the layout, so what renders in the map's place can say whether the map is live or has failed. */
export const MapStatusContext = createContext<(status: MapStatus) => void>(
  () => {},
);

/** Reports the status while the caller is mounted, and loading again once it unmounts. */
export function useReportMapStatus(status: Exclude<MapStatus, "loading">) {
  const report = useContext(MapStatusContext);

  useEffect(() => {
    report(status);
    return () => report("loading");
  }, [report, status]);
}
