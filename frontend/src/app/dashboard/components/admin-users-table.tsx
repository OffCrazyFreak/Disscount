"use client";

import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

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
      }
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
        <Loader2 className="size-6 animate-spin text-primary" />
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
              <TableHead className="w-48">Tip računa</TableHead>
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
                        Ti
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
                            {ACCOUNT_TYPE_LABELS[type]}
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
                      aria-label="Obriši račun"
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
        title="Brisanje računa"
        description={`Jeste li sigurni da želite obrisati račun ${
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
