"use client";

import { useFormatter, useTranslations } from "next-intl";
import { MapPinOff } from "lucide-react";
import NoResults from "@/components/custom/common/no-results";
import { Button } from "@/components/ui/button";
import AddPlainItemButton from "@/app/[locale]/products/components/results/add-plain-item-button";

interface INoPriceInLocationsProps {
  query: string;
  locations: string[];
  onShowAllLocations: () => void;
}

export default function NoPriceInLocations({
  query,
  locations,
  onShowAllLocations,
}: INoPriceInLocationsProps) {
  const t = useTranslations("products.list");
  const format = useFormatter();

  return (
    <div>
      <NoResults
        icon={
          <MapPinOff
            aria-hidden="true"
            className="size-12 text-muted-foreground mx-auto mb-4"
          />
        }
        title={t("noPriceInLocationsTitle", { count: locations.length })}
        description={t("noPriceInLocationsText", {
          count: locations.length,
          locations: format.list(locations, { type: "conjunction" }),
        })}
      />

      <div className="flex flex-wrap justify-center gap-3">
        <Button type="button" variant="outline" onClick={onShowAllLocations}>
          {t("showAllLocations")}
        </Button>

        <AddPlainItemButton query={query} variant="outline" />
      </div>
    </div>
  );
}
