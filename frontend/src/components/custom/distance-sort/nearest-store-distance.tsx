import { useLocale, useTranslations } from "next-intl";
import { MapPin } from "lucide-react";
import StoreOpeningBadge from "@/components/custom/store-hours/store-opening-badge";
import { formatDistance } from "@/utils/distance";
import type { INearestStore } from "@/utils/nearest-chain-distance";

interface INearestStoreDistanceProps {
  nearest: INearestStore;
}

/**
 * How far the chain's nearest store is, and whether that one store is open:
 * hours belong to a physical store, so a chain is never "open" as a whole.
 */
export default function NearestStoreDistance({
  nearest,
}: INearestStoreDistanceProps) {
  const t = useTranslations("common.distanceSort");
  const locale = useLocale();

  return (
    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <MapPin className="size-4 shrink-0" aria-hidden="true" />
        {t("nearest", { distance: formatDistance(nearest.km, locale) })}
      </span>

      <StoreOpeningBadge storeKey={nearest.key} />
    </span>
  );
}
