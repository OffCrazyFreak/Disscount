"use client";

import { Ref, useEffect, useRef, useState } from "react";
import { Loader2, LocateFixed } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { GeolocationStatus } from "@/hooks/use-geolocation";
import { geolocationMessageKey } from "@/app/[locale]/map/utils/geolocation-message";
import { cn } from "@/lib/utils";

interface IMapLocateButtonProps {
  status: GeolocationStatus;
  onLocate: () => void;
  ref?: Ref<HTMLButtonElement>;
}

export default function MapLocateButton({
  status,
  onLocate,
  ref,
}: IMapLocateButtonProps) {
  const t = useTranslations("map.nearMe");
  const isLocating = status === "locating";
  // Counted, because a browser without geolocation repeats one status, which would not rerun the effect.
  const [taps, setTaps] = useState(0);
  const answered = useRef(0);

  // The list shows these under its own button, so over the map a toast says it, only for this button's own taps.
  useEffect(() => {
    if (taps === answered.current || status === "locating") return;
    answered.current = taps;

    const messageKey = geolocationMessageKey(status);
    if (!messageKey) return;
    if (status === "approximate") toast.info(t(messageKey));
    else toast.error(t(messageKey));
  }, [taps, status, t]);

  return (
    <Button
      ref={ref}
      type="button"
      variant="outline"
      size="icon"
      aria-label={t("locate")}
      disabled={isLocating}
      onClick={() => {
        setTaps((count) => count + 1);
        onLocate();
      }}
      className={cn(
        "absolute right-2.5 bottom-32 z-[1] rounded-full bg-background shadow-md",
        (status === "located" || status === "approximate") && "text-primary",
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
