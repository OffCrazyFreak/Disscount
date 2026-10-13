import "server-only";

// Chains and OSM services ask scrapers to identify themselves; a stock
// library User-Agent is what gets an IP banned first.
const USER_AGENT = "Disscount/1.0 (+https://disscount.me)";

const TIMEOUT_MS = 30_000;

// The timeout covers reading the body too, and the DGU register is an 84 MB
// zip parsed while it streams.
const STREAM_TIMEOUT_MS = 10 * 60 * 1000;

async function request(
  url: string,
  signal: AbortSignal,
  init?: RequestInit,
  timeoutMs = TIMEOUT_MS,
) {
  const response = await fetch(url, {
    ...init,
    headers: { "User-Agent": USER_AGENT, ...init?.headers },
    signal: AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)]),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`GET ${url} failed with ${response.status}`);
  }

  return response;
}

export async function fetchText(
  url: string,
  signal: AbortSignal,
  init?: RequestInit,
): Promise<string> {
  return (await request(url, signal, init)).text();
}

export async function fetchJson(
  url: string,
  signal: AbortSignal,
  init?: RequestInit,
): Promise<unknown> {
  return (await request(url, signal, init)).json();
}

export async function fetchStream(
  url: string,
  signal: AbortSignal,
): Promise<ReadableStream<Uint8Array>> {
  const response = await request(url, signal, undefined, STREAM_TIMEOUT_MS);

  if (!response.body) throw new Error(`GET ${url} returned no body`);

  return response.body;
}

/** Pauses between requests so a sync never hammers one host. */
export function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);

    signal.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(signal.reason);
    });
  });
}
