"use client";

import { Flag, Navigation, Phone, Share2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { DirectoryStoreDto } from "@/lib/api/schemas";
import {
  appleMapsDirectionsUrl,
  googleMapsDirectionsUrl,
  telHref,
} from "@/app/[locale]/map/utils/directions-links";
import { openLocationReport } from "@/app/[locale]/map/utils/report-location";
import { toStoreKey } from "@/app/[locale]/map/utils/store-key";
import { shareOrCopy } from "@/utils/browser/share";
import { getChainLabel, getLocationLabel } from "@/utils/labels";

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

  async function share() {
    // The current path keeps the language prefix (/en/map) in the shared link.
    const url = new URL(window.location.pathname, window.location.origin);
    url.searchParams.set("store", toStoreKey(store.chain, store.code));

    const outcome = await shareOrCopy({
      title: `${getChainLabel(store.chain)}, ${getLocationLabel(store.city)}`,
      text: store.address ?? undefined,
      url: url.toString(),
    });

    if (outcome === "copied") toast.success(t("actions.copied"));
    if (outcome === "failed") toast.error(t("actions.shareFailed"));
  }

  return (
    <div className="flex flex-wrap gap-2">
      {point && (
        <>
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
        </>
      )}

      {phone && (
        <Button asChild variant="outline">
          <a href={phone}>
            <Phone aria-hidden="true" />
            {t("actions.call", { phone: store.phone ?? "" })}
          </a>
        </Button>
      )}

      <Button type="button" variant="outline" onClick={share}>
        <Share2 aria-hidden="true" />
        {t("actions.share")}
      </Button>

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
