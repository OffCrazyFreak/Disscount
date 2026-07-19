"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@/context/user-context";
import { isAdmin } from "@/lib/api/schemas/auth-user";
import AdminUsersTable from "@/app/dashboard/components/admin-users-table";

// Feature plans add their own tab (Kontakt, Bug reports, Ideje) beside Korisnici.
export default function DashboardContent() {
  const { user } = useUser();
  const userIsAdmin = isAdmin(user?.accountType);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">
        <span className="text-primary">Disscount</span> Nadzorna ploča
      </h1>

      {userIsAdmin ? (
        <Tabs defaultValue="users">
          <TabsList>
            <TabsTrigger value="users">Korisnici</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-3">
            <AdminUsersTable />
          </TabsContent>
        </Tabs>
      ) : (
        <p className="text-muted-foreground">
          Ovdje će uskoro biti dostupni podaci i alati.
        </p>
      )}
    </div>
  );
}
