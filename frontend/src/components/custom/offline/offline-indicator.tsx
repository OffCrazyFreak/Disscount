"use client";

import { WifiOff } from "lucide-react";
import { useIsMutating } from "@tanstack/react-query";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { isOfflineMutationKey } from "@/lib/offline/offline-mutation-keys";

// Tells the user the data is cached and how many writes are queued to sync.
export default function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const pendingWrites = useIsMutating({
    predicate: (mutation) => isOfflineMutationKey(mutation.options.mutationKey),
  });

  if (isOnline) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[60] flex items-center justify-center gap-2 bg-amber-500 px-3 py-1.5 text-center text-sm font-medium text-white">
      <WifiOff className="size-4 shrink-0" />
      {pendingWrites > 0
        ? `Izvan mreže - spremljene promjene (${pendingWrites}) sinkronizirat će se kasnije.`
        : "Izvan mreže - prikazujemo spremljene podatke."}
    </div>
  );
}
