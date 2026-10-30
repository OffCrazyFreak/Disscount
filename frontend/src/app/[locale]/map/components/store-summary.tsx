"use client";

import { MapPinOff } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import StoreChainLogo from "@/components/custom/store-chain/store-chain-logo";
import FavoriteStoreButton from "@/app/[locale]/map/components/favorite-store-button";
import ShareStoreButton from "@/app/[locale]/map/components/share-store-button";
import { IListedStore } from "@/app/[locale]/map/hooks/use-visible-stores";
import { formatDistance } from "@/app/[locale]/map/utils/distance";
import { cn } from "@/lib/utils";

interface IStoreSummaryProps {
  row: IListedStore;
  /** Open shows the whole address and the share pill. */
  isOpen: boolean;
  /** Prefixes the ids that summaryLabelIds names. */
  id: string;
}

/** The ids of the parts a store's name is read from, for aria-labelledby. */
export function summaryLabelIds(row: IListedStore, id: string): string {
  const isPlaced = row.store.lat != null && row.store.lon != null;

  return [
    "name",
    "address",
    !isPlaced && "noLocation",
    row.distanceKm != null && "distance",
  ]
    .filter(Boolean)
    .map((part) => `${id}-${part}`)
    .join(" ");
}

/** A store's logo, name, address and distance, as a list row and the phone sheet show it. */
export default function StoreSummary({ row, isOpen, id }: IStoreSummaryProps) {
  const t = useTranslations("map.list");
  const locale = useLocale();
  const { store, chainLabel, cityLabel, distanceKm } = row;
  const isPlaced = store.lat != null && store.lon != null;
  const place = [store.zipcode, cityLabel].filter(Boolean).join(" ");
  const address = [store.address, place].filter(Boolean).join(", ");
  const fit = isOpen ? "break-words" : "truncate";

  return (
    <>
      <span
        className="relative size-10 shrink-0 overflow-hidden rounded-sm border bg-white"
        aria-hidden="true"
      >
        <StoreChainLogo
          chain={store.chain}
          width={40}
          height={40}
          className="object-contain"
        />
      </span>

      <span className="min-w-0 flex-1">
        <span id={`${id}-name`} className={cn("block font-medium", fit)}>
          {chainLabel}
        </span>

        <span className={cn("block text-sm text-muted-foreground", fit)}>
          <span id={`${id}-address`} lang={address ? "hr" : undefined}>
            {address || t("unknownAddress")}
          </span>
          {isOpen && (
            <>
              <ShareStoreButton store={store} />
              <FavoriteStoreButton storeKey={row.key} />
            </>
          )}
        </span>
      </span>

      {/* Beside the text, not after it, so an ellipsis can never hide it. */}
      {!isPlaced && (
        <span className="shrink-0 text-amber-700" title={t("noLocation")}>
          <MapPinOff className="size-4" aria-hidden="true" />
          <span id={`${id}-noLocation`} className="sr-only">
            {t("noLocation")}
          </span>
        </span>
      )}

      {distanceKm != null && (
        <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
          <span aria-hidden="true">{formatDistance(distanceKm, locale)}</span>
          <span id={`${id}-distance`} className="sr-only">
            {t("distance", { distance: formatDistance(distanceKm, locale) })}
          </span>
        </span>
      )}
    </>
  );
}
