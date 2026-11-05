import "server-only";

import { z } from "zod";

import { sanitizeCoordinates } from "@/lib/store-locations/croatia-bounds";
import { fetchJson } from "@/lib/store-locations/http";

type Coordinate = number | null | undefined;

/** Reads a JSON store feed and keeps the rows whose coordinates land in Croatia. */
export async function fetchPlacedRows<T>(
  url: string,
  schema: z.ZodType<T>,
  signal: AbortSignal,
  coordinatesOf: (row: T) => [Coordinate, Coordinate],
) {
  const rows = z.array(schema).parse(await fetchJson(url, signal));
  const placed: { row: T; point: { lat: number; lon: number } }[] = [];

  for (const row of rows) {
    const point = sanitizeCoordinates(...coordinatesOf(row));

    if (point) placed.push({ row, point });
  }

  return placed;
}
