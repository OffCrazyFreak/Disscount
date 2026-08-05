import type { GetPricesParams } from "@/lib/cijene-api/schemas";

function canonicalizeCsv(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;

  return [
    ...new Set(
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ]
    .sort()
    .join(",");
}

/**
 * Sorts and dedupes the CSV members and trims the free-text filters, so the same
 * request written two ways is one cache entry and one upstream call. Callers
 * build `eans` and `chains` from selection order, which varies per render.
 *
 * Both the key and the request body go through this: keying on a canonical form
 * while sending the raw one would cache a response under a request nobody made.
 */
export function canonicalizeGetPricesParams(
  params: GetPricesParams,
): GetPricesParams {
  return {
    ...params,
    eans: canonicalizeCsv(params.eans) ?? "",
    chains: canonicalizeCsv(params.chains),
    city: params.city?.trim(),
    address: params.address?.trim(),
  };
}
