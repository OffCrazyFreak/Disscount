"use client";

import { useState } from "react";
import { toast } from "sonner";

import TableSkeleton from "@/components/custom/skeleton/table-skeleton";
import { ConfirmDialog } from "@/components/custom/modal/confirm-dialog";
import { LOADING_LABELS } from "@/constants/loading-labels";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AdminUserRow from "@/app/dashboard/components/admin-user-row";
import { adminService } from "@/lib/api";
import { AccountType, UserDto } from "@/lib/api/schemas/auth-user";
import { useUser } from "@/context/user-context";
import { adminQueries } from "@/lib/api/admin/hooks";
import { useAuthedQuery } from "@/lib/query/use-authed-query";

export default function AdminUsersTable() {
  const { user: currentUser } = useUser();
  const {
    data: users,
    pending: isLoading,
    isError,
  } = useAuthedQuery(adminQueries.users());
  const updateAccountType = adminService.useUpdateUserAccountType();
  const deleteUser = adminService.useDeleteUser();

  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserDto | null>(null);

  function handleChange(userId: string, accountType: AccountType) {
    setUpdatingId(userId);

    updateAccountType.mutate(
      { userId, accountType },
      {
        onSuccess: () => toast.success("Tip računa ažuriran!"),
        onError: () => toast.error("Greška pri promjeni tipa računa."),
        onSettled: () => setUpdatingId(null),
      },
    );
  }

  function handleDelete() {
    if (!deleteTarget) return;

    deleteUser.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Račun je obrisan!");
        setDeleteTarget(null);
      },
      onError: () => toast.error("Greška pri brisanju računa."),
    });
  }

  if (isLoading) {
    return <TableSkeleton columns={4} />;
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive">
        Greška pri dohvaćanju korisnika.
      </p>
    );
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Korisničko ime</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Zadnja prijava</TableHead>
              <TableHead className="w-48">Tip računa</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {users?.map((user) => (
              <AdminUserRow
                key={user.id}
                user={user}
                isSelf={user.id === currentUser?.id}
                isUpdating={updatingId === user.id}
                onAccountTypeChange={handleChange}
                onDelete={setDeleteTarget}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Brisanje računa"
        description={`Sigurno želiš obrisati račun ${
          deleteTarget?.username || deleteTarget?.email || ""
        }? Ova akcija se ne može poništiti.`}
        confirmLabel="Obriši račun"
        confirmLoadingLabel={LOADING_LABELS.deleting}
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={deleteUser.isPending}
      />
    </>
  );
}
