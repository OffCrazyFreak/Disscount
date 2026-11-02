import { getProductThumbnails } from "@/lib/api/product-images/queries";

const MAX_PER_REQUEST = 100;
const GATHER_MS = 15;

type Waiter = {
  resolve: (url: string | null) => void;
  reject: (error: unknown) => void;
};

const waiting = new Map<string, Waiter[]>();
let timer: ReturnType<typeof setTimeout> | null = null;

/** Rows ask one EAN at a time; asks within a few milliseconds share a request. */
export function loadThumbnail(ean: string): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const list = waiting.get(ean) ?? [];
    list.push({ resolve, reject });
    waiting.set(ean, list);
    timer ??= setTimeout(flush, GATHER_MS);
  });
}

function flush() {
  timer = null;
  const batch = new Map(waiting);
  waiting.clear();

  const eans = [...batch.keys()];
  for (let from = 0; from < eans.length; from += MAX_PER_REQUEST) {
    const chunk = eans.slice(from, from + MAX_PER_REQUEST);
    getProductThumbnails(chunk).then(
      (found) => {
        for (const ean of chunk) {
          batch.get(ean)?.forEach((w) => w.resolve(found[ean] ?? null));
        }
      },
      (error: unknown) => {
        for (const ean of chunk)
          batch.get(ean)?.forEach((w) => w.reject(error));
      },
    );
  }
}
