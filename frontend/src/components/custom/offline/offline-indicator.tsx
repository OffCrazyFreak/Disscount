"use client";

import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/use-online-status";

// Thin banner shown while the device is offline; reassures the user that the
// data on screen is the locally cached copy.
export default function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[60] flex items-center justify-center gap-2 bg-amber-500 px-3 py-1.5 text-center text-sm font-medium text-white">
      <WifiOff className="size-4 shrink-0" />
      Izvan mreže — prikazujemo spremljene podatke.
    </div>
  );
}
