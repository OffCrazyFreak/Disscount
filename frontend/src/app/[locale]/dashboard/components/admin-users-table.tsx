"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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
import AdminUserRow from "@/app/[locale]/dashboard/components/admin-user-row";
import { adminService } from "@/lib/api";
import { AccountType, UserDto } from "@/lib/api/schemas/auth-user";
import { useUser } from "@/context/user-context";

export default function AdminUsersTable() {
  const t = useTranslations("dashboard");
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
        onSuccess: () => toast.success(t("users.accountTypeUpdated")),
        onError: () => toast.error(t("users.accountTypeError")),
        onSettled: () => setUpdatingId(null),
      },
    );
  }

  function handleDelete() {
    if (!deleteTarget) return;

    deleteUser.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success(t("users.deleted"));
        setDeleteTarget(null);
      },
      onError: () => toast.error(t("users.deleteError")),
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
    return <p className="text-sm text-destructive">{t("users.loadError")}</p>;
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("users.colUsername")}</TableHead>
              <TableHead>{t("users.colEmail")}</TableHead>
              <TableHead>{t("users.colLastLogin")}</TableHead>
              <TableHead className="w-48">
                {t("users.colAccountType")}
              </TableHead>
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
        title={t("users.deleteTitle")}
        description={t("users.deleteDescription", {
          name: deleteTarget?.username || deleteTarget?.email || "",
        })}
        confirmLabel={t("users.deleteConfirm")}
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={deleteUser.isPending}
      />
    </>
  );
}
