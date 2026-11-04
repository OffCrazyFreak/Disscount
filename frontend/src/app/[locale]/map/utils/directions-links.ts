import { ILatLon } from "@/utils/distance";

// Apple's unified /directions path needs iOS 18.4, so the older ?daddr= form is used, which every version understands.

export function googleMapsDirectionsUrl({ lat, lon }: ILatLon): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
}

export function appleMapsDirectionsUrl({ lat, lon }: ILatLon): string {
  return `https://maps.apple.com/?daddr=${lat},${lon}`;
}

/** Digits and a leading plus only, so a messy upstream value still dials. */
export function telHref(phone: string): string | null {
  const cleaned = phone.replace(/[^\d+]/g, "");

  return cleaned.length >= 6 ? `tel:${cleaned}` : null;
}
