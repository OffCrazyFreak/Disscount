"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";

import { useStoreOpening } from "@/components/custom/store-hours/store-hours-context";
import { clockOf } from "@/components/custom/store-hours/use-opening-status-text";
import type { TimeRangeDto } from "@/lib/api/schemas";
import { cn } from "@/lib/utils";
import { type IWeekDay, weekHoursOf } from "@/lib/store-hours/week-hours";

const WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

interface IStoreWeekHoursProps {
  storeKey: string;
}

function rangesText(ranges: TimeRangeDto[]): string {
  return ranges
    .map((range) => `${clockOf(range.opens)} - ${clockOf(range.closes)}`)
    .join(", ");
}

/** Rolling from today, because past days have lost their holiday and dated data. */
export default function StoreWeekHours({ storeKey }: IStoreWeekHoursProps) {
  const t = useTranslations("storeHours.week");
  const headingId = useId();
  const opening = useStoreOpening(storeKey);

  if (!opening?.hours) return null;

  const days = weekHoursOf(opening.hours, opening.holidays, opening.now);

  if (days.every((day) => day.ranges === null)) return null;

  function hoursText(day: IWeekDay): string {
    if (day.ranges === null) {
      return t(day.isRestrictedSunday ? "someSundays" : "unconfirmed");
    }

    return day.ranges.length === 0 ? t("closed") : rangesText(day.ranges);
  }

  function noteOf(day: IWeekDay): string | null {
    if (day.isException) return t("exception");
    if (day.isHoliday) return t("holiday");

    return null;
  }

  return (
    <section aria-labelledby={headingId} className="text-xs">
      <h3 id={headingId} className="mb-1 font-medium text-foreground">
        {t("title")}
      </h3>

      {/* role="list", because list-style: none drops the list from Safari's accessibility tree. */}
      <ul role="list" className="flex flex-col">
        {days.map((day) => {
          const note = noteOf(day);

          return (
            <li
              key={day.date}
              aria-current={day.isToday ? "date" : undefined}
              className={cn(
                "flex items-baseline justify-between gap-3 rounded-md px-2 py-0.5 text-muted-foreground",
                day.isToday && "bg-primary/10 font-medium text-foreground",
              )}
            >
              <span>
                {t(`days.${WEEKDAY_KEYS[day.weekday]}`)}
                {day.isToday && (
                  <span className="text-primary"> · {t("today")}</span>
                )}
              </span>

              <span className="text-right tabular-nums">
                {hoursText(day)}
                {note && (
                  <span className="block text-amber-700 dark:text-amber-300">
                    {note}
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
