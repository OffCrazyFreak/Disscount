"use client";

import { useTranslations } from "next-intl";

import type { OpeningStatus } from "@/lib/store-hours/opening-status";
import {
  addDays,
  isoWeekday,
  zagrebClock,
} from "@/lib/store-hours/zagreb-clock";

const WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

const LABEL_KEYS = {
  open: "open",
  "closing-soon": "closingSoon",
  closed: "closed",
  unconfirmed: "unconfirmed",
} as const;

function dayOf(date: string, today: string): string {
  if (date === today) return "today";
  if (date === addDays(today, 1)) return "tomorrow";

  return WEEKDAY_KEYS[isoWeekday(date)];
}

/** The badge word and the "closes at" or "opens at" line for a status. */
export function useOpeningStatusText() {
  const t = useTranslations("storeHours");

  return function describe(status: OpeningStatus, now: Date) {
    const label = t(`status.${LABEL_KEYS[status.state]}`);

    if (status.state === "open" || status.state === "closing-soon") {
      return {
        label,
        detail: status.closesAt
          ? t("closesAt", { time: status.closesAt.time })
          : null,
      };
    }

    if (status.state === "closed") {
      const today = zagrebClock(now).date;

      return {
        label,
        detail: status.opensAt
          ? t("opensAt", {
              day: dayOf(status.opensAt.date, today),
              time: status.opensAt.time,
            })
          : null,
      };
    }

    return { label, detail: null };
  };
}
