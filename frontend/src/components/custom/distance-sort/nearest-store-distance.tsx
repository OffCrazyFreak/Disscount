"use client";

import { useLocale, useTranslations } from "next-intl";
import OpeningStatusDetail from "@/components/custom/store-hours/opening-status-detail";
import { useStoreOpening } from "@/components/custom/store-hours/store-hours-context";
import { useOpeningStatusText } from "@/components/custom/store-hours/use-opening-status-text";
import { formatDistance } from "@/utils/distance";
import { getLocationLabel } from "@/utils/labels";
import type { INearestStore } from "@/utils/nearest-chain-distance";

interface INearestStoreDistanceProps {
  nearest: INearestStore;
}

/** Hours belong to a physical store, so a chain is never "open" as a whole. */
export default function NearestStoreDistance({
  nearest,
}: INearestStoreDistanceProps) {
  const t = useTranslations("common.distanceSort");
  const tMap = useTranslations("map.list");
  const locale = useLocale();
  const describe = useOpeningStatusText();
  const opening = useStoreOpening(nearest.key);

  const distance = formatDistance(nearest.km, locale);
  const address = [nearest.address, getLocationLabel(nearest.city)]
    .filter(Boolean)
    .join(", ");
  // The owner wants only the word here; the times stay on the map and in the price table.
  const state =
    opening && opening.status.state !== "unconfirmed"
      ? describe(opening.status, opening.now).label
      : null;
  const shownAddress = address || tMap("unknownAddress");

  return (
    <OpeningStatusDetail
      name={t("nearestName", {
        distance,
        store: [shownAddress, state].filter(Boolean).join(", "),
      })}
      detail={
        <span className="flex flex-col">
          <span lang={address ? "hr" : undefined}>{shownAddress}</span>
          {state && <span className="font-medium">{state}</span>}
        </span>
      }
    >
      <span className="text-sm font-normal whitespace-nowrap text-muted-foreground">
        ({distance})
      </span>
    </OpeningStatusDetail>
  );
}
