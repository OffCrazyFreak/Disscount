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
import { useContributorPhotoCounts } from "@/lib/api/product-images/admin-hooks";
import { AccountType, UserDto } from "@/lib/api/schemas/auth-user";
import { useUser } from "@/context/user-context";

export default function AdminUsersTable() {
  const t = useTranslations("dashboard");
  const { user: currentUser } = useUser();
  const { data: users, isLoading, isError } = adminService.useGetAllUsers();
  const updateAccountType = adminService.useUpdateUserAccountType();
  const deleteUser = adminService.useDeleteUser();
  const { data: photoCounts } = useContributorPhotoCounts();
  const photosByUser = new Map(
    photoCounts?.map((count) => [count.userId, count]),
  );

  const [updatingIds, setUpdatingIds] = useState<ReadonlySet<string>>(
    new Set(),
  );
  const [deleteTarget, setDeleteTarget] = useState<UserDto | null>(null);

  function handleChange(userId: string, accountType: AccountType) {
    setUpdatingIds((ids) => new Set(ids).add(userId));

    // mutateAsync, not mutate options: those fire only for the latest call, so a row saved earlier would roll back without a toast.
    updateAccountType
      .mutateAsync({ userId, accountType })
      .then(
        () => toast.success(t("users.accountTypeUpdated")),
        () => toast.error(t("users.accountTypeError")),
      )
      .finally(() =>
        setUpdatingIds((ids) => {
          const next = new Set(ids);
          next.delete(userId);
          return next;
        }),
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

  // Only a list with nothing cached is missing; a failed refetch keeps its last answer.
  if (isError && users === undefined) {
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
              <TableHead>{t("users.colPhotos")}</TableHead>
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
                isUpdating={updatingIds.has(user.id)}
                photos={photosByUser.get(user.id)}
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
