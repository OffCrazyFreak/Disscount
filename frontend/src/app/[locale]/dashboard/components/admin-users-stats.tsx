"use client";

import AdminActivityCard from "@/app/[locale]/dashboard/components/admin-activity-card";
import {
  MONTHLY_WINDOW_DAYS,
  WEEKLY_WINDOW_DAYS,
} from "@/app/[locale]/dashboard/utils/user-activity";
import { adminService } from "@/lib/api";

/** Active-user counters above the user list; shares its cached query, so no extra request. */
export default function AdminUsersStats() {
  const { data: users, isLoading, isError } = adminService.useGetAllUsers();

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <AdminActivityCard
        title="Tjedno aktivni korisnici"
        abbreviation="WAU"
        defaultWindowDays={WEEKLY_WINDOW_DAYS}
        users={users}
        isLoading={isLoading}
        isError={isError}
      />

      <AdminActivityCard
        title="Mjesečno aktivni korisnici"
        abbreviation="MAU"
        defaultWindowDays={MONTHLY_WINDOW_DAYS}
        users={users}
        isLoading={isLoading}
        isError={isError}
      />
    </div>
  );
}
