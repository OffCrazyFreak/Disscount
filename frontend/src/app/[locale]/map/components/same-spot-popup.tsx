"use client";

import { KeyboardEvent, useEffect, useId, useRef } from "react";
import { useTranslations } from "next-intl";
import { Popup, useMap } from "react-map-gl/maplibre";

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
  const titleId = useId();
  const listRef = useRef<HTMLUListElement>(null);
  const { current: map } = useMap();

  const rows = spot ? stores.filter((row) => spot.keys.includes(row.key)) : [];

  useEffect(() => {
    listRef.current?.querySelector("button")?.focus();
  }, [spot]);

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key !== "Escape") return;

    // Focus would otherwise drop to the page body with the popup gone.
    map?.getCanvas().focus();
    onClose();
  }

  if (!spot || rows.length === 0) return null;

  return (
    <Popup
      longitude={spot.lon}
      latitude={spot.lat}
      anchor="bottom"
      offset={28}
      closeButton={false}
      onClose={onClose}
      maxWidth="16rem"
      className="[&_.maplibregl-popup-content]:bg-popover [&_.maplibregl-popup-content]:p-2 [&_.maplibregl-popup-content]:text-popover-foreground [&_.maplibregl-popup-tip]:border-t-popover!"
    >
      <div role="group" aria-labelledby={titleId} onKeyDown={handleKeyDown}>
        <p id={titleId} className="px-2 pb-1 text-xs text-muted-foreground">
          {t("sameSpot", { count: rows.length })}
        </p>

        <ul ref={listRef}>
          {rows.map((row) => (
            <li key={row.key}>
              <button
                type="button"
                onClick={() => onSelect(row.key)}
                className="flex w-full items-center gap-2 rounded-md p-2 text-left text-sm hover:bg-accent focus-visible:outline-2 focus-visible:outline-primary"
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
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Popup>
  );
}
