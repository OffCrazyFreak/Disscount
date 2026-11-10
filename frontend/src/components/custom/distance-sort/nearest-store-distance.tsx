"use client";

import { useLocale, useTranslations } from "next-intl";
import DetailPopoverButton from "@/components/custom/common/detail-popover-button";
import { useStoreOpening } from "@/components/custom/store-hours/store-hours-context";
import { useOpeningStatusText } from "@/components/custom/store-hours/use-opening-status-text";
import { formatDistance } from "@/utils/distance";
import { formatStoreAddress, getLocationLabel } from "@/utils/labels";
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
  const address = formatStoreAddress({
    address: nearest.address,
    zipcode: nearest.zipcode,
    cityLabel: getLocationLabel(nearest.city),
  });
  // The owner wants only the word here; the times stay on the map and in the price table.
  const state =
    opening && opening.status.state !== "unconfirmed"
      ? describe(opening.status, opening.now).label
      : null;
  const shownAddress = address || tMap("unknownAddress");

  return (
    <DetailPopoverButton
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
    </DetailPopoverButton>
  );
}
