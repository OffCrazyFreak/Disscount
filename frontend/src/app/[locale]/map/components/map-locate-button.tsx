"use client";

import { useEffect, useRef } from "react";
import { Loader2, LocateFixed } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { GeolocationStatus } from "@/app/[locale]/map/hooks/use-geolocation";
import { geolocationMessageKey } from "@/app/[locale]/map/utils/geolocation-message";
import { cn } from "@/lib/utils";

interface IMapLocateButtonProps {
  status: GeolocationStatus;
  onLocate: () => void;
}

/** The phone map's own near-me control, above the zoom buttons. */
export default function MapLocateButton({
  status,
  onLocate,
}: IMapLocateButtonProps) {
  const t = useTranslations("map.nearMe");
  const isLocating = status === "locating";
  const tapped = useRef(false);

  // The list shows these under its own button; over the map a toast says it.
  // Only for this button's own tap, which any settled status answers.
  useEffect(() => {
    if (!tapped.current || status === "locating") return;
    tapped.current = false;

    const messageKey = geolocationMessageKey(status);
    if (messageKey) toast.error(t(messageKey));
  }, [status, t]);

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label={t("locate")}
      disabled={isLocating}
      onClick={() => {
        tapped.current = true;
        onLocate();
      }}
      className={cn(
        "absolute right-2.5 bottom-32 z-[1] rounded-full bg-background shadow-md",
        status === "located" && "text-primary",
      )}
    >
      {isLocating ? (
        <Loader2
          className="animate-spin motion-reduce:animate-none"
          aria-hidden="true"
        />
      ) : (
        <LocateFixed aria-hidden="true" />
      )}
    </Button>
  );
}
