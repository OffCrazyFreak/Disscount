import { Monitor, Smartphone, Tablet, type LucideIcon } from "lucide-react";

import { formatLocale } from "@/i18n/formatting";
import { MILLISECONDS_PER_DAY } from "@/utils/date";
import type { AccountSessionDto } from "@/lib/api/schemas/account-session";

// An unknown device shows as a monitor, the most common kind.
export const DEVICE_ICONS: Record<
  NonNullable<AccountSessionDto["deviceType"]> | "unknown",
  LucideIcon
> = {
  mobile: Smartphone,
  tablet: Tablet,
  desktop: Monitor,
  unknown: Monitor,
};

export function countryName(code: string | null, locale: string) {
  if (!code) return null;
  try {
    return (
      new Intl.DisplayNames(formatLocale(locale), { type: "region" }).of(
        code,
      ) ?? null
    );
  } catch {
    return null;
  }
}

// Whole days only: the server refreshes the timestamp at most once a day.
export function lastActiveWhen(isoDate: string, locale: string) {
  const days = Math.max(
    0,
    Math.floor((Date.now() - Date.parse(isoDate)) / MILLISECONDS_PER_DAY),
  );
  return new Intl.RelativeTimeFormat(formatLocale(locale), {
    numeric: "auto",
  }).format(-days, "day");
}
