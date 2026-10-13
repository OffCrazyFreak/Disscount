"use client";

import { MapPinOff } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import StoreChainLogo from "@/components/custom/store-chain/store-chain-logo";
import { IListedStore } from "@/app/[locale]/map/hooks/use-visible-stores";
import { formatDistance } from "@/app/[locale]/map/utils/distance";
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
  const t = useTranslations("map.list");
  const locale = useLocale();
  const { store, chainLabel, cityLabel, distanceKm } = row;
  const isPlaced = store.lat != null && store.lon != null;

  return (
    <button
      type="button"
      data-store-key={row.key}
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
          {store.address && <span lang="hr">, {store.address}</span>}
        </span>

        <span className="block truncate text-sm text-muted-foreground">
          {cityLabel ? <span lang="hr">{cityLabel}</span> : t("unknownCity")}
          {!isPlaced && (
            <span className="ml-2 inline-flex items-center gap-1 text-amber-700">
              <MapPinOff className="size-3.5" aria-hidden="true" />
              {t("noLocation")}
            </span>
          )}
        </span>
      </span>

      {distanceKm != null && (
        <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
          {formatDistance(distanceKm, locale)}
        </span>
      )}
    </button>
  );
}
