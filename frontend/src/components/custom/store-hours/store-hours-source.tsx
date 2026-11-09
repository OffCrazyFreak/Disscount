"use client";

import { SquareArrowOutUpRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { useStoreOpening } from "@/components/custom/store-hours/store-hours-context";
import { useOpeningStatusText } from "@/components/custom/store-hours/use-opening-status-text";
import { HOURS_CHAINS } from "@/lib/store-hours/hours-chains";
import { getChainLabel } from "@/utils/labels";
import { formatDate } from "@/utils/strings";

interface IStoreHoursSourceProps {
  storeKey: string;
  chain: string;
  /** The store's name, for the status change a screen reader hears. */
  storeLabel: string;
}

/** The "Provjeri" link exists because a scraped table can be wrong. */
export default function StoreHoursSource({
  storeKey,
  chain,
  storeLabel,
}: IStoreHoursSourceProps) {
  const t = useTranslations("storeHours");
  const locale = useLocale();
  const describe = useOpeningStatusText();
  const opening = useStoreOpening(storeKey);

  if (!opening) return null;

  const { status, now, hours } = opening;
  const { name } = describe(status, now);
  const source =
    hours &&
    (hours.source === "osm"
      ? t("source.osm")
      : t("source.chain", { chain: getChainLabel(chain) }));
  // A store no source covers can still be checked on its chain's finder.
  const checkUrl = hours
    ? hours.checkUrl
    : (HOURS_CHAINS[chain]?.finderUrl ?? null);

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
      {/* Mounted with the open store, so only a change while it is open is read out. */}
      <p role="status" className="sr-only">
        {t("changed", { store: storeLabel, status: name })}
      </p>

      {source && (
        <span>
          {status.asOf
            ? t("source.dated", {
                source,
                date: formatDate(status.asOf, locale),
              })
            : source}
        </span>
      )}

      {checkUrl && (
        <a
          href={checkUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t("checkLabel")}
          className="inline-flex items-center gap-1 font-medium text-primary underline-offset-2 hover:underline"
        >
          {t("check")}
          <SquareArrowOutUpRight className="size-3.5" aria-hidden="true" />
        </a>
      )}
    </div>
  );
}
