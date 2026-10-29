import { ILatLon } from "@/app/[locale]/map/utils/distance";

const METRES_PER_DEGREE = 111_320;

function degreeSpan({ lat }: ILatLon, radiusM: number) {
  return {
    dLat: radiusM / METRES_PER_DEGREE,
    dLon: radiusM / (METRES_PER_DEGREE * Math.cos((lat * Math.PI) / 180)),
  };
}

/** South-west and north-east corners, in MapLibre's [lon, lat] order. */
export function circleBounds(
  center: ILatLon,
  radiusM: number,
): [[number, number], [number, number]] {
  const { dLat, dLon } = degreeSpan(center, radiusM);

  return [
    [center.lon - dLon, center.lat - dLat],
    [center.lon + dLon, center.lat + dLat],
  ];
}

/** A GeoJSON polygon close enough to a circle at country scale. */
export function circlePolygon(center: ILatLon, radiusM: number, steps = 64) {
  const { dLat, dLon } = degreeSpan(center, radiusM);
  const ring = Array.from({ length: steps + 1 }, (_, i) => {
    const angle = (i / steps) * 2 * Math.PI;
    return [
      center.lon + dLon * Math.cos(angle),
      center.lat + dLat * Math.sin(angle),
    ];
  });

  return {
    type: "Feature" as const,
    geometry: { type: "Polygon" as const, coordinates: [ring] },
    properties: {},
  };
}
