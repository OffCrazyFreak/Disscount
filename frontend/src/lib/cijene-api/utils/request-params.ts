function parseNumberParam(value: string | null): number | undefined {
  return value ? parseFloat(value) : undefined;
}

function parseTextParam(value: string | null): string | undefined {
  return value?.trim() || undefined;
}

/**
 * Reads the geo filters that both the prices and stores endpoints accept:
 * a coordinate pair plus a radius.
 */
export function parseGeoParams(searchParams: URLSearchParams) {
  return {
    lat: parseNumberParam(searchParams.get("lat")),
    lon: parseNumberParam(searchParams.get("lon")),
    d: parseNumberParam(searchParams.get("d")),
  };
}

/**
 * Reads the store filters shared by the prices and stores endpoints.
 */
export function parseStoreFilterParams(searchParams: URLSearchParams) {
  return {
    chains: parseTextParam(searchParams.get("chains")),
    city: parseTextParam(searchParams.get("city")),
    address: parseTextParam(searchParams.get("address")),
    ...parseGeoParams(searchParams),
  };
}
