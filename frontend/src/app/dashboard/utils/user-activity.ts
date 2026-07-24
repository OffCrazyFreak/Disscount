import type { ILabeledSelectOption } from "@/components/custom/common/labeled-select";
import { UserDto } from "@/lib/api/schemas/auth-user";
import { MILLISECONDS_PER_DAY } from "@/utils/date";

export const ACTIVITY_WINDOW_OPTIONS: ILabeledSelectOption[] = [
  { value: "1", label: "Zadnji 1 dan" },
  { value: "7", label: "Zadnjih 7 dana" },
  { value: "14", label: "Zadnjih 14 dana" },
  { value: "30", label: "Zadnjih 30 dana" },
  { value: "90", label: "Zadnjih 90 dana" },
];

export const WEEKLY_WINDOW_DAYS = "7";
export const MONTHLY_WINDOW_DAYS = "30";

/**
 * Users seen within the trailing window. Only the latest activity per user is stored,
 * so the window has to end now - a past-to-past range would miss anyone seen since.
 */
export function countActiveUsers(
  users: UserDto[] | undefined,
  windowDays: string,
): number {
  const cutoff = Date.now() - Number(windowDays) * MILLISECONDS_PER_DAY;

  return (users ?? []).filter((user) => {
    if (!user.lastActiveAt) return false;

    const lastActive = new Date(user.lastActiveAt).getTime();
    return !Number.isNaN(lastActive) && lastActive >= cutoff;
  }).length;
}
