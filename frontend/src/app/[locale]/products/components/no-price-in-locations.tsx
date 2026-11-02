"use client";

import { useFormatter, useTranslations } from "next-intl";
import { MapPinOff } from "lucide-react";
import NoResults from "@/components/custom/common/no-results";
import { Button } from "@/components/ui/button";

interface INoPriceInLocationsProps {
  locations: string[];
  onShowAllLocations: () => void;
}

/** The search found products, but no store in the selected places prices them. */
export default function NoPriceInLocations({
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
            className="size-12 text-gray-400 mx-auto mb-4"
          />
        }
        title={t("noPriceInLocationsTitle", { count: locations.length })}
        description={t("noPriceInLocationsText", {
          count: locations.length,
          locations: format.list(locations, { type: "conjunction" }),
        })}
      />

      <div className="text-center">
        <Button type="button" variant="outline" onClick={onShowAllLocations}>
          {t("showAllLocations")}
        </Button>
      </div>
    </div>
  );
}
