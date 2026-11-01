import { useLocale, useTranslations } from "next-intl";
import { MapPin } from "lucide-react";
import { formatDistance } from "@/app/[locale]/map/utils/distance";

interface INearestStoreDistanceProps {
  km: number;
}

/** How far the chain's nearest store is, shown while sorting by distance. */
export default function NearestStoreDistance({
  km,
}: INearestStoreDistanceProps) {
  const t = useTranslations("common.distanceSort");
  const locale = useLocale();

  return (
    <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
      <MapPin className="size-4 shrink-0" aria-hidden="true" />
      {t("nearest", { distance: formatDistance(km, locale) })}
    </span>
  );
}
