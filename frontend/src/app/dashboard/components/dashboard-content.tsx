"use client";

import { useUser } from "@/context/user-context";
import { isAdmin } from "@/lib/api/schemas/auth-user";
import AdminUsersTable from "@/app/dashboard/components/admin-users-table";

export default function DashboardContent() {
  const { user } = useUser();
  const userIsAdmin = isAdmin(user?.accountType);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">
        <span className="text-primary">Disscount</span> Nadzorna ploča
      </h1>

      {userIsAdmin ? (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Upravljanje korisnicima</h2>
          <AdminUsersTable />
        </div>
      ) : (
        <p className="text-muted-foreground">
          Ovdje će uskoro biti dostupni podaci i alati.
        </p>
      )}
    </div>
  );
}
