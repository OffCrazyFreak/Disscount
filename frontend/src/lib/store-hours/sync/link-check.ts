import "server-only";

import { delay, fetchStatus } from "@/lib/store-locations/http";
import {
  readCheckUrls,
  saveLinkStatus,
} from "@/lib/store-hours/sync/hours-repository";
import { linksByHost, linkStatusOf } from "@/lib/store-hours/sync/link-status";

// The same pace the hours sync keeps on a chain's store pages.
const PAUSE_MS = 1000;

/** Visits every store's "Provjeri" link, one page a second per host, hosts side by side. */
export async function runLinkCheck(signal: AbortSignal): Promise<void> {
  const groups = linksByHost(await readCheckUrls());

  await Promise.all(
    groups.map(async (urls) => {
      for (const url of urls) {
        await saveLinkStatus(url, linkStatusOf(await fetchStatus(url, signal)));
        await delay(PAUSE_MS, signal);
      }
    }),
  );
}
