import { formatLocale } from "@/i18n/formatting";

export interface ILatLon {
  lat: number;
  lon: number;
}

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Great-circle distance in kilometres. */
export function distanceKm(a: ILatLon, b: ILatLon): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLon = toRadians(b.lon - a.lon);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.lat)) *
      Math.cos(toRadians(b.lat)) *
      Math.sin(dLon / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/** "350 m" under a kilometre, "4,2 km" under ten, "37 km" beyond. */
export function formatDistance(km: number, locale: string): string {
  const format = (value: number, unit: "meter" | "kilometer", digits = 0) =>
    new Intl.NumberFormat(formatLocale(locale), {
      style: "unit",
      unit,
      maximumFractionDigits: digits,
    }).format(value);

  if (km < 1) return format(Math.max(10, Math.round(km * 100) * 10), "meter");
  if (km < 10) return format(Math.round(km * 10) / 10, "kilometer", 1);

  return format(Math.round(km), "kilometer");
}
