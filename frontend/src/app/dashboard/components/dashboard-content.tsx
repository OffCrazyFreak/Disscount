"use client";

import { useTranslations } from "next-intl";

import { useUser } from "@/context/user-context";
import { isAdmin } from "@/lib/api/schemas/auth-user";
import AdminUsersTable from "@/app/dashboard/components/admin-users-table";

export default function DashboardContent() {
  const { user } = useUser();
  const t = useTranslations("pages.dashboard");
  const userIsAdmin = isAdmin(user?.accountType);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">
        <span className="text-primary">Disscount</span> {t("heading")}
      </h1>

      {userIsAdmin ? (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">{t("userManagement")}</h2>
          <AdminUsersTable />
        </div>
      ) : (
        <p className="text-muted-foreground">{t("noAdminInfo")}</p>
      )}
    </div>
  );
}
