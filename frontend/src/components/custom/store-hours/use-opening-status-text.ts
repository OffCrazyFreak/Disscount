"use client";

import { useTranslations } from "next-intl";

import type { OpeningStatus } from "@/lib/store-hours/opening-status";
import {
  addDays,
  isoWeekday,
  zagrebClock,
} from "@/lib/store-hours/zagreb-clock";

const WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

const DETAIL_KEYS = {
  open: "open",
  "closing-soon": "closingSoon",
  closed: "closed",
  "opening-soon": "openingSoon",
} as const;

export interface IOpeningStatusText {
  /** The badge's word: only open, closed or unconfirmed; colour carries "soon". */
  label: string;
  /** The tooltip line, such as "Zatvara u 21:00"; null when there is no time to name. */
  detail: string | null;
  /** The word and the detail together, for screen readers and live regions. */
  name: string;
}

function dayOf(date: string, today: string): string {
  if (date === today) return "today";
  if (date === addDays(today, 1)) return "tomorrow";

  return WEEKDAY_KEYS[isoWeekday(date)];
}

// The owner's copy reads 7:00, not 07:00.
function clockOf(time: string): string {
  return time.replace(/^0(?=\d)/, "");
}

/** The badge word, its tooltip line and its full accessible name for a status. */
export function useOpeningStatusText() {
  const t = useTranslations("storeHours");

  return function describe(
    status: OpeningStatus,
    now: Date,
  ): IOpeningStatusText {
    if (status.state === "unconfirmed") {
      const label = t("status.unconfirmed");

      return { label, detail: null, name: label };
    }

    const isOpen = "closesAt" in status;
    const label = t(isOpen ? "status.open" : "status.closed");
    const moment = isOpen ? status.closesAt : status.opensAt;

    if (!moment) return { label, detail: null, name: label };

    // The catalogs turn "midnight" into each language's own phrase, such as "u ponoć".
    const time = moment.time === "24:00" ? "midnight" : clockOf(moment.time);
    const when = t("when", {
      day: dayOf(moment.date, zagrebClock(now).date),
      time,
    });
    const key = DETAIL_KEYS[status.state];

    return {
      label,
      detail: t(`detail.${key}`, { time, when }),
      name: t(`name.${key}`, { time, when }),
    };
  };
}
