"use client";

import { useReportMapStatus } from "@/app/[locale]/map/hooks/use-map-status";

/** Rendered among the map's children, which mount only while a live map exists. */
export default function MapPresence() {
  useReportMapStatus("live");
  return null;
}
