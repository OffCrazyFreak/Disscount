import "server-only";

import {
  parseStudenacList,
  parseStudenacPage,
} from "@/lib/store-hours/sources/studenac-hours";
import type {
  IHoursRecord,
  IHoursSource,
} from "@/lib/store-hours/sync/hours-source-types";
import { delay, fetchText } from "@/lib/store-locations/http";

const LIST_URL = "https://www.studenac.hr/trgovine";

const PAGE_INTERVAL_MS = 1_000;

/** The list page has only today's hours, so only stores upstream lists are fetched (about 20 of 1,433), joined by store number. */
export const studenacHoursSource: IHoursSource = {
  chain: "studenac",

  async fetchHours(signal, codes) {
    // Upstream writes store 53 as "T053" and store 1010 as "1010".
    const byNumber = new Map(
      [...codes].map((code) => [String(Number(code.replace(/^T/, ""))), code]),
    );
    const cards = parseStudenacList(await fetchText(LIST_URL, signal)).flatMap(
      (card) => {
        const code = byNumber.get(String(Number(card.code)));

        return code ? [{ ...card, code }] : [];
      },
    );
    const records: IHoursRecord[] = [];

    for (const card of cards) {
      await delay(PAGE_INTERVAL_MS, signal);

      try {
        const hours = parseStudenacPage(await fetchText(card.pageUrl, signal));

        if (hours) records.push({ ...card, hours });
      } catch (error) {
        console.warn(
          `[store-hours] studenac page failed ${card.pageUrl}`,
          error,
        );
      }
    }

    return records;
  },
};
