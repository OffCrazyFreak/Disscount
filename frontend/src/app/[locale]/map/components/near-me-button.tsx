"use client";

import { LocateFixed, Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { GeolocationStatus } from "@/app/[locale]/map/hooks/use-geolocation";
import { geolocationMessageKey } from "@/app/[locale]/map/utils/geolocation-message";

interface INearMeButtonProps {
  status: GeolocationStatus;
  onLocate: () => void;
  onClear: () => void;
}

/** Asks for the position on a tap; the page itself never prompts. */
export default function NearMeButton({
  status,
  onLocate,
  onClear,
}: INearMeButtonProps) {
  const t = useTranslations("map.nearMe");
  const messageKey = geolocationMessageKey(status);

  return (
    <div className="flex flex-col gap-1.5">
      {status === "located" ? (
        <Button type="button" variant="primarySoft" onClick={onClear}>
          <X aria-hidden="true" />
          {t("clear")}
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={onLocate}
          disabled={status === "locating"}
        >
          {status === "locating" ? (
            <Loader2
              className="animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
          ) : (
            <LocateFixed aria-hidden="true" />
          )}
          {t("locate")}
        </Button>
      )}

      <p role="status" className="text-sm text-amber-800 empty:hidden">
        {messageKey && t(messageKey)}
      </p>
    </div>
  );
}
