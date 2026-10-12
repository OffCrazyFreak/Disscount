import { UserDto } from "@/lib/api/schemas/auth-user";
import { MILLISECONDS_PER_DAY } from "@/utils/date";

export type ActivityWindowDays = "1" | "7" | "14" | "30" | "90";

export const ACTIVITY_WINDOW_VALUES: ActivityWindowDays[] = [
  "1",
  "7",
  "14",
  "30",
  "90",
];

export const WEEKLY_WINDOW_DAYS: ActivityWindowDays = "7";
export const MONTHLY_WINDOW_DAYS: ActivityWindowDays = "30";

/**
 * Users seen within the trailing window. Only the latest activity per user is stored,
 * so the window has to end now - a past-to-past range would miss anyone seen since.
 */
export function countActiveUsers(
  users: UserDto[] | undefined,
  windowDays: ActivityWindowDays,
): number {
  const cutoff = Date.now() - Number(windowDays) * MILLISECONDS_PER_DAY;

  return (users ?? []).filter((user) => {
    if (!user.lastActiveAt) return false;

    const lastActive = new Date(user.lastActiveAt).getTime();
    return !Number.isNaN(lastActive) && lastActive >= cutoff;
  }).length;
}
