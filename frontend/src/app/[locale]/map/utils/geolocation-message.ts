import { GeolocationStatus } from "@/app/[locale]/map/hooks/use-geolocation";

const MESSAGE_KEYS = {
  denied: "denied",
  unavailable: "unavailable",
  timeout: "timeout",
} as const;

/** The map.nearMe key explaining a failed locate, or null when nothing failed. */
export function geolocationMessageKey(status: GeolocationStatus) {
  return status in MESSAGE_KEYS
    ? MESSAGE_KEYS[status as keyof typeof MESSAGE_KEYS]
    : null;
}
