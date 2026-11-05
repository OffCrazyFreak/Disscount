"use client";

import { MapPinOff } from "lucide-react";
import { useTranslations } from "next-intl";

import StoreHoursSource from "@/components/custom/store-hours/store-hours-source";
import StoreActions from "@/app/[locale]/map/components/store-actions";
import { IListedStore } from "@/app/[locale]/map/hooks/use-visible-stores";

interface IStoreDetailsProps {
  row: IListedStore;
}

export default function StoreDetails({ row }: IStoreDetailsProps) {
  const t = useTranslations("map.details");
  const { store } = row;
  const isPlaced = store.lat != null && store.lon != null;

  return (
    <div className="flex flex-col gap-3 px-3 pb-3 pt-1">
      {!isPlaced && (
        <p className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          <MapPinOff className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {t("notPlaced")}
        </p>
      )}

      {/* Keyed so the always-mounted phone sheet announces only a status change, not each new store. */}
      <StoreHoursSource
        key={row.key}
        storeKey={row.key}
        chain={store.chain}
        storeLabel={row.chainLabel}
      />

      <StoreActions store={store} />
    </div>
  );
}
