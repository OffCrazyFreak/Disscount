"use client";

import { useEffect, useRef } from "react";
import { ArrowLeft, MapPinOff } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import StoreChainLogo from "@/components/custom/store-chain/store-chain-logo";
import StoreActions from "@/app/[locale]/map/components/store-actions";
import { IListedStore } from "@/app/[locale]/map/hooks/use-visible-stores";
import { formatDistance } from "@/app/[locale]/map/utils/distance";

interface IStoreDetailsProps {
  row: IListedStore;
  onClose: () => void;
}

/** The selected store; Back in the browser closes it too. */
export default function StoreDetails({ row, onClose }: IStoreDetailsProps) {
  const t = useTranslations("map.details");
  const locale = useLocale();
  const { store, chainLabel, cityLabel, distanceKm } = row;
  const isPlaced = store.lat != null && store.lon != null;
  const headingRef = useRef<HTMLHeadingElement>(null);

  // The list this replaced held focus, so it moves here instead of to <body>.
  useEffect(() => {
    headingRef.current?.focus();
  }, [store.chain, store.code]);

  return (
    <section
      aria-labelledby="store-details-title"
      className="flex flex-col gap-4 p-4"
    >
      <button
        type="button"
        onClick={onClose}
        className="inline-flex w-fit items-center gap-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {t("back")}
      </button>

      <div className="flex items-center gap-3">
        <span
          className="relative size-14 shrink-0 overflow-hidden rounded-full border bg-white"
          aria-hidden="true"
        >
          <StoreChainLogo
            chain={store.chain}
            width={56}
            height={56}
            className="object-contain p-1.5"
          />
        </span>

        <div className="min-w-0">
          <h2
            ref={headingRef}
            id="store-details-title"
            tabIndex={-1}
            className="text-lg font-semibold outline-none"
          >
            {chainLabel}
          </h2>

          {store.address || cityLabel ? (
            <p lang="hr" className="text-sm text-muted-foreground">
              {[
                store.address,
                [store.zipcode, cityLabel].filter(Boolean).join(" "),
              ]
                .filter(Boolean)
                .join(", ")}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("unknownAddress")}
            </p>
          )}

          {distanceKm != null && (
            <p className="text-sm text-muted-foreground">
              {t("distance", { distance: formatDistance(distanceKm, locale) })}
            </p>
          )}
        </div>
      </div>

      {!isPlaced && (
        <p className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          <MapPinOff className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {t("notPlaced")}
        </p>
      )}

      <StoreActions store={store} />
    </section>
  );
}
