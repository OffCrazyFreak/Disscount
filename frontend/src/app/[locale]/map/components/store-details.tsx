"use client";

import { MapPinOff } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import StoreActions from "@/app/[locale]/map/components/store-actions";
import { IListedStore } from "@/app/[locale]/map/hooks/use-visible-stores";
import { formatDistance } from "@/app/[locale]/map/utils/distance";

interface IStoreDetailsProps {
  row: IListedStore;
}

/** The body of an open list item: full address, distance and actions. */
export default function StoreDetails({ row }: IStoreDetailsProps) {
  const t = useTranslations("map.details");
  const locale = useLocale();
  const { store, cityLabel, distanceKm } = row;
  const isPlaced = store.lat != null && store.lon != null;
  const place = [store.zipcode, cityLabel].filter(Boolean).join(" ");

  return (
    <div className="flex flex-col gap-3 px-3 pb-3 pt-1">
      <div className="text-sm text-muted-foreground">
        {store.address || place ? (
          <p lang="hr">{[store.address, place].filter(Boolean).join(", ")}</p>
        ) : (
          <p>{t("unknownAddress")}</p>
        )}

        {distanceKm != null && (
          <p>
            {t("distance", { distance: formatDistance(distanceKm, locale) })}
          </p>
        )}
      </div>

      {!isPlaced && (
        <p className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          <MapPinOff className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {t("notPlaced")}
        </p>
      )}

      <StoreActions store={store} />
    </div>
  );
}
