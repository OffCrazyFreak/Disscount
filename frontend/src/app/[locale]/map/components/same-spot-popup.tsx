"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Marker, useMap } from "react-map-gl/maplibre";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import StoreChainLogo from "@/components/custom/store-chain/store-chain-logo";
import { IListedStore } from "@/app/[locale]/map/hooks/use-visible-stores";
import { ISameSpot } from "@/app/[locale]/map/utils/map-feature-click";

interface ISameSpotPopupProps {
  spot: ISameSpot | null;
  stores: IListedStore[];
  onSelect: (key: string) => void;
  onClose: () => void;
}

/** Stores at one address (a mall), which no zoom level pulls apart. */
export default function SameSpotPopup({
  spot,
  stores,
  onSelect,
  onClose,
}: ISameSpotPopupProps) {
  const t = useTranslations("map.list");
  const { current: map } = useMap();
  const closedByEscape = useRef(false);

  const rows = spot ? stores.filter((row) => spot.keys.includes(row.key)) : [];

  // A filter that hides every store here closes the list for good, rather
  // than leaving it to reappear over an old spot when the filter clears.
  const isEmpty = spot != null && rows.length === 0;
  useEffect(() => {
    if (isEmpty) onClose();
  }, [isEmpty, onClose]);

  // The popover sits outside the map and would not follow a pan or zoom.
  useEffect(() => {
    if (!spot || !map) return;

    map.on("movestart", onClose);
    return () => {
      map.off("movestart", onClose);
    };
  }, [spot, map, onClose]);

  if (!spot || rows.length === 0) return null;

  return (
    <Popover open onOpenChange={(open) => !open && onClose()}>
      <Marker longitude={spot.lon} latitude={spot.lat}>
        <PopoverAnchor asChild>
          <span className="block size-0" />
        </PopoverAnchor>
      </Marker>

      <PopoverContent
        side="top"
        sideOffset={28}
        aria-label={t("sameSpot", { count: rows.length })}
        onEscapeKeyDown={() => {
          closedByEscape.current = true;
        }}
        // There is no trigger to return to. After Escape, focus goes back to
        // the map; after a click elsewhere it stays where the user put it.
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          if (closedByEscape.current) map?.getCanvas().focus();
          closedByEscape.current = false;
        }}
        className="w-64 p-1"
      >
        <ul>
          {rows.map((row) => (
            <li key={row.key}>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onSelect(row.key)}
                className="h-auto w-full justify-start gap-2 p-2 text-left font-normal"
              >
                <span
                  className="relative size-7 shrink-0 overflow-hidden rounded-sm border bg-white"
                  aria-hidden="true"
                >
                  <StoreChainLogo
                    chain={row.store.chain}
                    width={28}
                    height={28}
                    className="object-contain"
                  />
                </span>

                <span className="min-w-0">
                  <span className="block font-medium">{row.chainLabel}</span>
                  {row.store.address && (
                    <span
                      lang="hr"
                      className="block truncate text-xs text-muted-foreground"
                    >
                      {row.store.address}
                    </span>
                  )}
                </span>
              </Button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
