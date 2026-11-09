import { GeolocationStatus } from "@/hooks/use-geolocation";

const MESSAGE_KEYS = {
  approximate: "approximate",
  denied: "denied",
  unavailable: "unavailable",
  timeout: "timeout",
} as const;

export function geolocationMessageKey(status: GeolocationStatus) {
  return status in MESSAGE_KEYS
    ? MESSAGE_KEYS[status as keyof typeof MESSAGE_KEYS]
    : null;
}
