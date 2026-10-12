"use client";

import { useTranslations } from "next-intl";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@/context/user-context";
import { isAdmin } from "@/lib/api/schemas/auth-user";
import AdminUsersStats from "@/app/[locale]/dashboard/components/admin-users-stats";
import AdminUsersTable from "@/app/[locale]/dashboard/components/admin-users-table";
import AdminContactTable from "@/app/[locale]/dashboard/components/admin-contact-table";

// Feature plans add their own tab (Kontakt, Bug reports, Ideje) beside Korisnici.
export default function DashboardContent() {
  const t = useTranslations("dashboard");
  const { user } = useUser();
  const userIsAdmin = isAdmin(user?.accountType);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">
        <span className="text-primary">Disscount</span> {t("content.title")}
      </h1>

      {userIsAdmin ? (
        <Tabs defaultValue="users">
          <TabsList>
            <TabsTrigger value="users">{t("content.tabUsers")}</TabsTrigger>
            <TabsTrigger value="contact">{t("content.tabContact")}</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <AdminUsersStats />
            <AdminUsersTable />
          </TabsContent>

          <TabsContent value="contact" className="space-y-3">
            <AdminContactTable />
          </TabsContent>
        </Tabs>
      ) : (
        <p className="text-muted-foreground">{t("content.comingSoon")}</p>
      )}
    </div>
  );
}
