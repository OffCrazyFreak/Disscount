"use client";

import { ChevronDown, MapPinOff } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import StoreChainLogo from "@/components/custom/store-chain/store-chain-logo";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import StoreDetails from "@/app/[locale]/map/components/store-details";
import { IListedStore } from "@/app/[locale]/map/hooks/use-visible-stores";
import { formatDistance } from "@/app/[locale]/map/utils/distance";
import { cn } from "@/lib/utils";

interface IStoreListItemProps {
  row: IListedStore;
  isSelected: boolean;
  /** Null closes the store. */
  onSelect: (key: string | null) => void;
}

/** A store that opens in place; the open one is the store selected on the map. */
export default function StoreListItem({
  row,
  isSelected,
  onSelect,
}: IStoreListItemProps) {
  const t = useTranslations("map.list");
  const locale = useLocale();
  const { store, chainLabel, cityLabel, distanceKm } = row;
  const isPlaced = store.lat != null && store.lon != null;
  const place = [store.zipcode, cityLabel].filter(Boolean).join(" ");
  const address = [store.address, place].filter(Boolean).join(", ");
  const fit = isSelected ? "break-words" : "truncate";

  return (
    <Collapsible
      open={isSelected}
      onOpenChange={(open) => onSelect(open ? row.key : null)}
      className={cn("rounded-lg", isSelected && "bg-primary/10")}
    >
      <CollapsibleTrigger
        data-store-key={row.key}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent/70 focus-visible:outline-2 focus-visible:outline-primary"
      >
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
          <span className={cn("block font-medium", fit)}>{chainLabel}</span>

          <span className={cn("block text-sm text-muted-foreground", fit)}>
            {address ? <span lang="hr">{address}</span> : t("unknownAddress")}
          </span>
        </span>

        {/* Beside the text, not after it, so an ellipsis can never hide it. */}
        {!isPlaced && (
          <span className="shrink-0 text-amber-700" title={t("noLocation")}>
            <MapPinOff className="size-4" aria-hidden="true" />
            <span className="sr-only">{t("noLocation")}</span>
          </span>
        )}

        {distanceKm != null && (
          <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
            <span aria-hidden="true">{formatDistance(distanceKm, locale)}</span>
            <span className="sr-only">
              {t("distance", { distance: formatDistance(distanceKm, locale) })}
            </span>
          </span>
        )}

        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform motion-reduce:transition-none",
            isSelected && "rotate-180",
          )}
          aria-hidden="true"
        />
      </CollapsibleTrigger>

      <CollapsibleContent className="my-0">
        <StoreDetails row={row} />
      </CollapsibleContent>
    </Collapsible>
  );
}
