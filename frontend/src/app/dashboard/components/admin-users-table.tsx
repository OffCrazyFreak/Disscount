"use client";

import { useState } from "react";
import { toast } from "sonner";

import BlockLoadingSpinner from "@/components/custom/common/block-loading-spinner";
import { ConfirmDialog } from "@/components/custom/modal/confirm-dialog";
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

export default function AdminUsersTable() {
  const { user: currentUser } = useUser();
  const { data: users, isLoading, isError } = adminService.useGetAllUsers();
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
    return (
      <div className="flex justify-center py-12">
        <BlockLoadingSpinner size={24} />
      </div>
    );
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
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={deleteUser.isPending}
      />
    </>
  );
}
