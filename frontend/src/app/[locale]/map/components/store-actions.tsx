"use client";

import { Flag, Navigation, Phone } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { DirectoryStoreDto } from "@/lib/api/schemas";
import {
  appleMapsDirectionsUrl,
  googleMapsDirectionsUrl,
  telHref,
} from "@/app/[locale]/map/utils/directions-links";
import { openLocationReport } from "@/app/[locale]/map/utils/report-location";
import { formatCroatianPhone } from "@/app/[locale]/map/utils/phone-format";

interface IStoreActionsProps {
  store: DirectoryStoreDto;
}

export default function StoreActions({ store }: IStoreActionsProps) {
  const t = useTranslations("map");
  const point =
    store.lat != null && store.lon != null
      ? { lat: store.lat, lon: store.lon }
      : null;
  const phone = store.phone ? telHref(store.phone) : null;

  return (
    <div className="flex flex-wrap gap-2">
      {point && (
        <ButtonGroup className="w-full [&>*]:flex-1">
          <Button asChild variant="primary">
            <a
              href={googleMapsDirectionsUrl(point)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Navigation aria-hidden="true" />
              {t("actions.googleDirections")}
            </a>
          </Button>

          <Button asChild variant="outline">
            <a
              href={appleMapsDirectionsUrl(point)}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("actions.appleMaps")}
            </a>
          </Button>
        </ButtonGroup>
      )}

      {phone && (
        <Button asChild variant="outline">
          <a href={phone}>
            <Phone aria-hidden="true" />
            {t("actions.call", {
              phone: formatCroatianPhone(store.phone ?? ""),
            })}
          </a>
        </Button>
      )}

      <Button
        type="button"
        variant="ghost"
        onClick={() =>
          openLocationReport(store, {
            subject: t("report.subject"),
            message: (name, id) => t("report.message", { store: name, id }),
          })
        }
      >
        <Flag aria-hidden="true" />
        {t("actions.report")}
      </Button>
    </div>
  );
}
