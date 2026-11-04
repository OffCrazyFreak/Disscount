import "server-only";

import { z } from "zod";

import type { IHoursSource } from "@/lib/store-hours/sync/hours-source-types";
import {
  comingSunday,
  parseDayText,
  weekFromLabelled,
} from "@/lib/store-hours/sources/hours-text";
import { labelledLines } from "@/lib/store-hours/sources/labelled-lines";
import { zagrebClock } from "@/lib/store-hours/zagreb-clock";
import { sanitizeCoordinates } from "@/lib/store-locations/croatia-bounds";
import { fetchJson } from "@/lib/store-locations/http";

const URL = "https://trgovina-krk.hr/wp-admin/admin-ajax.php";

const rowSchema = z.object({
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  link: z.string(),
  adresa: z.string(),
  "radno-vrijeme": z.string(),
  radnox: z.string().catch(""),
  neradna_nedjelja: z.string().catch(""),
});

// "Trg Bana Josipa Jelačića 11, Dvor": the town follows the last comma.
function splitAddress(raw: string) {
  const cut = raw.lastIndexOf(",");

  return cut === -1
    ? { address: raw.trim() }
    : { address: raw.slice(0, cut).trim(), city: raw.slice(cut + 1).trim() };
}

/** The flag is named `neradna_nedjelja`, yet the site's own "Otvoreno ove nedjelje" filter selects rows where it is "1". */
export const trgovinaKrkHoursSource: IHoursSource = {
  chain: "trgovina-krk",

  async fetchHours(signal) {
    const payload = await fetchJson(URL, signal, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "action=nedjelje_map_fetch_stores&post_type=prodavaonice",
    });
    const rows = z.array(z.unknown()).parse(payload);
    const sunday = comingSunday(zagrebClock(new Date()).date);

    return rows.flatMap((raw) => {
      const row = rowSchema.safeParse(raw);
      const point =
        row.success && sanitizeCoordinates(row.data.lat, row.data.lng);

      if (!row.success || !point) return [];

      const lines = labelledLines(row.data["radno-vrijeme"]);
      const sundayHours = parseDayText(row.data.radnox) ?? [];
      const opensSunday =
        row.data.neradna_nedjelja === "1" && sundayHours.length > 0;

      if (lines.length === 0) return [];

      return [
        {
          ...splitAddress(row.data.adresa),
          ...point,
          hours: {
            weekly: weekFromLabelled(lines),
            dated: [{ date: sunday, ranges: opensSunday ? sundayHours : [] }],
          },
          pageUrl: row.data.link.startsWith("https://trgovina-krk.hr/")
            ? row.data.link
            : undefined,
        },
      ];
    });
  },
};
