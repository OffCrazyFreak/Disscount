"use client";

import { MapPinOff } from "lucide-react";

import StoreChainLogo from "@/components/custom/store-chain/store-chain-logo";
import { IListedStore } from "@/app/map/hooks/use-visible-stores";
import { formatDistance } from "@/app/map/utils/distance";
import { cn } from "@/lib/utils";

interface IStoreListItemProps {
  row: IListedStore;
  isSelected: boolean;
  onSelect: (key: string) => void;
}

export default function StoreListItem({
  row,
  isSelected,
  onSelect,
}: IStoreListItemProps) {
  const { store, chainLabel, cityLabel, distanceKm } = row;
  const isPlaced = store.lat != null && store.lon != null;

  return (
    <button
      type="button"
      onClick={() => onSelect(row.key)}
      aria-current={isSelected ? "true" : undefined}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent/70 focus-visible:outline-2 focus-visible:outline-primary",
        isSelected && "bg-primary/10",
      )}
    >
      <span
        className="relative size-10 shrink-0 overflow-hidden rounded-full border bg-white"
        aria-hidden="true"
      >
        <StoreChainLogo
          chain={store.chain}
          width={40}
          height={40}
          className="object-contain p-1"
        />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">
          {chainLabel}
          {store.address ? `, ${store.address}` : ""}
        </span>

        <span className="block truncate text-sm text-muted-foreground">
          {cityLabel || "Nepoznat grad"}
          {!isPlaced && (
            <span className="ml-2 inline-flex items-center gap-1 text-amber-700">
              <MapPinOff className="size-3.5" aria-hidden="true" />
              bez lokacije
            </span>
          )}
        </span>
      </span>

      {distanceKm != null && (
        <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
          {formatDistance(distanceKm)}
        </span>
      )}
    </button>
  );
}
