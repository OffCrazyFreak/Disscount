"use client";

import { LocateFixed, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GeolocationStatus } from "@/app/map/hooks/use-geolocation";

interface INearMeButtonProps {
  status: GeolocationStatus;
  onLocate: () => void;
  onClear: () => void;
}

const MESSAGES: Partial<Record<GeolocationStatus, string>> = {
  denied:
    "Pristup lokaciji je odbijen. Dopusti ga u postavkama preglednika ili pretraži po gradu.",
  unavailable:
    "Lokacija trenutačno nije dostupna. Pretraži po gradu ili adresi.",
  timeout:
    "Traženje lokacije traje predugo. Pokušaj ponovno ili pretraži po gradu.",
};

/** Asks for the position only on a tap, never on page load. */
export default function NearMeButton({
  status,
  onLocate,
  onClear,
}: INearMeButtonProps) {
  const message = MESSAGES[status];

  return (
    <div className="flex flex-col gap-1.5">
      {status === "located" ? (
        <Button type="button" variant="primarySoft" onClick={onClear}>
          <X aria-hidden="true" />
          Ukloni moju lokaciju
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={onLocate}
          disabled={status === "locating"}
        >
          {status === "locating" ? (
            <Loader2 className="animate-spin" aria-hidden="true" />
          ) : (
            <LocateFixed aria-hidden="true" />
          )}
          Trgovine blizu mene
        </Button>
      )}

      <p role="status" className="text-sm text-amber-800 empty:hidden">
        {message}
      </p>
    </div>
  );
}
