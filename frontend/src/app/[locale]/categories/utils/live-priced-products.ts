import type { ProductResponse } from "@/lib/cijene-api/schemas";
import type { ServerProductResult } from "@/lib/cijene-api/server/get-product";

// The price API is shared and rate limited, so a hub asks a few products at a time.
const LOOKUP_CONCURRENCY = 6;

// A slow price API must not hold the page; products still waiting show without a price.
const LOOKUP_DEADLINE_MS = 3_000;

interface ILivePriceOptions {
  concurrency?: number;
  deadlineMs?: number;
}

/** Null when nothing was found and a lookup failed, so the page answers 500, not an unpriced 200. */
export async function livePricedProducts(
  eans: string[],
  lookUp: (ean: string) => Promise<ServerProductResult>,
  {
    concurrency = LOOKUP_CONCURRENCY,
    deadlineMs = LOOKUP_DEADLINE_MS,
  }: ILivePriceOptions = {},
): Promise<Map<string, ProductResponse> | null> {
  const found = new Map<string, ProductResponse>();
  let failed = false;
  let next = 0;
  let expired = false;

  async function worker() {
    while (!expired && next < eans.length) {
      const result = await lookUp(eans[next++]);

      if (result.status === "found") {
        found.set(result.product.ean, result.product);
      } else if (result.status === "unavailable") {
        failed = true;
      }
    }
  }

  let timer: ReturnType<typeof setTimeout> | undefined;

  const deadline = new Promise<void>((resolve) => {
    timer = setTimeout(() => {
      expired = true;
      resolve();
    }, deadlineMs);
  });

  const workers = Array.from(
    { length: Math.min(concurrency, eans.length) },
    worker,
  );

  await Promise.race([Promise.all(workers), deadline]);
  clearTimeout(timer);

  if (found.size === 0 && (failed || expired)) return null;

  return new Map(found);
}
