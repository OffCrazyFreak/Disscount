"use client";

import { Flag, Navigation, Phone, Share2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DirectoryStoreDto } from "@/lib/api/schemas";
import {
  appleMapsDirectionsUrl,
  googleMapsDirectionsUrl,
  telHref,
} from "@/app/map/utils/directions-links";
import { openLocationReport } from "@/app/map/utils/report-location";
import { toStoreKey } from "@/app/map/utils/store-key";
import { shareOrCopy } from "@/utils/browser/share";
import { getChainLabel, getLocationLabel } from "@/utils/labels";

interface IStoreActionsProps {
  store: DirectoryStoreDto;
}

export default function StoreActions({ store }: IStoreActionsProps) {
  const point =
    store.lat != null && store.lon != null
      ? { lat: store.lat, lon: store.lon }
      : null;
  const phone = store.phone ? telHref(store.phone) : null;

  async function share() {
    const url = new URL("/map", window.location.origin);
    url.searchParams.set("store", toStoreKey(store.chain, store.code));

    const outcome = await shareOrCopy({
      title: `${getChainLabel(store.chain)}, ${getLocationLabel(store.city)}`,
      text: store.address ?? undefined,
      url: url.toString(),
    });

    if (outcome === "copied") toast.success("Poveznica je kopirana.");
    if (outcome === "failed") toast.error("Dijeljenje nije uspjelo.");
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
              Upute (Google karte)
            </a>
          </Button>

          <Button asChild variant="outline">
            <a
              href={appleMapsDirectionsUrl(point)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Apple karte
            </a>
          </Button>
        </>
      )}

      {phone && (
        <Button asChild variant="outline">
          <a href={phone}>
            <Phone aria-hidden="true" />
            Nazovi {store.phone}
          </a>
        </Button>
      )}

      <Button type="button" variant="outline" onClick={share}>
        <Share2 aria-hidden="true" />
        Podijeli
      </Button>

      <Button
        type="button"
        variant="ghost"
        onClick={() => openLocationReport(store)}
      >
        <Flag aria-hidden="true" />
        Prijavi grešku
      </Button>
    </div>
  );
}
