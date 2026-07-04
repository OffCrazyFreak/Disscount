"use client";

import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { adminService } from "@/lib/api";
import {
  AccountType,
  ACCOUNT_TYPE_LABELS,
  UserDto,
} from "@/lib/api/schemas/auth-user";
import { useUser } from "@/context/user-context";

const ACCOUNT_TYPES = Object.keys(ACCOUNT_TYPE_LABELS) as AccountType[];

export default function AdminUsersTable() {
  const { user: currentUser } = useUser();
  const t = useTranslations("pages.dashboard");
  const tTypes = useTranslations("accountTypes");
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
        onSuccess: () => toast.success(t("accountTypeUpdated")),
        onError: () => toast.error(t("accountTypeError")),
        onSettled: () => setUpdatingId(null),
      }
    );
  }

  function handleDelete() {
    if (!deleteTarget) return;

    deleteUser.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success(t("accountDeleted"));
        setDeleteTarget(null);
      },
      onError: () => toast.error(t("deleteError")),
    });
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive">{t("loadError")}</p>
    );
  }

  return (
    <>
      <div className="rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("colUsername")}</TableHead>
              <TableHead>{t("colEmail")}</TableHead>
              <TableHead className="w-48">{t("colAccountType")}</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {users?.map((u) => {
              const isSelf = u.id === currentUser?.id;

              return (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">
                    {u.username || "—"}
                    {isSelf && (
                      <Badge variant="secondary" className="ml-2">
                        {t("you")}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {u.email || "—"}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={u.accountType}
                      onValueChange={(value) =>
                        handleChange(u.id, value as AccountType)
                      }
                      disabled={isSelf || updatingId === u.id}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ACCOUNT_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {tTypes(type)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label={t("deleteAccountAria")}
                      className="text-destructive hover:text-destructive"
                      disabled={isSelf}
                      onClick={() => setDeleteTarget(u)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={t("deleteTitle")}
        description={t("deleteConfirm", {
          name: deleteTarget?.username || deleteTarget?.email || "",
        })}
        confirmLabel={t("confirmDelete")}
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={deleteUser.isPending}
      />
    </>
  );
}
