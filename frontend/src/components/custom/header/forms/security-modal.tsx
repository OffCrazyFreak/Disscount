"use client";

import { useState } from "react";
import { Trash2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { userService } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { clearAuthToken } from "@/lib/api/api-base";
import { ACCOUNT_TYPE_LABELS } from "@/lib/api/schemas/auth-user";
import { useUser } from "@/context/user-context";

interface ISecurityModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SecurityModal({
  isOpen,
  onOpenChange,
}: ISecurityModalProps) {
  const { user, setUser } = useUser();
  const queryClient = useQueryClient();

  const [isRevoking, setIsRevoking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showLogoutAllConfirm, setShowLogoutAllConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  async function handleLogoutAll() {
    setIsRevoking(true);
    setShowLogoutAllConfirm(false);

    try {
      await authClient.revokeOtherSessions();
      toast.success("Odjavljen si sa svih ostalih uređaja!");
      onOpenChange(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nepoznata greška";
      toast.error(`Greška pri odjavi sa svih uređaja: ${message}`);
    } finally {
      setIsRevoking(false);
    }
  }

  async function handleDeleteUser() {
    setIsDeleting(true);
    setShowDeleteConfirm(false);

    try {
      await authClient.deleteUser();
      await userService.deleteCurrentUser();

      clearAuthToken();
      queryClient.clear();
      setUser(null);

      toast.success("Račun je uspješno obrisan!");
      onOpenChange(false);
    } catch (error) {
      if (isAxiosError(error)) {
        const status = error.response?.status ?? 0;
        const serverMessage = (error.response?.data as { message?: string })
          ?.message;

        if (status === 404) {
          toast.error("Korisnički račun nije pronađen.");
        } else if (status >= 500) {
          toast.error("Serverska greška. Pokušaj ponovo.");
        } else {
          toast.error(serverMessage || "Greška pri brisanju računa.");
        }
      } else {
        toast.error("Greška pri brisanju računa. Provjeri internetsku vezu.");
      }
    } finally {
      setIsDeleting(false);
    }
  }

  const isLoading = isRevoking || isDeleting;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl">Sigurnost</DialogTitle>
            <DialogDescription>
              Upravljaj prijavama i svojim računom.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            {user?.accountType && (
              <div className="flex items-center justify-between rounded-lg border p-4">
                <span className="text-sm font-medium">Tip računa</span>
                <Badge variant="secondary">
                  {ACCOUNT_TYPE_LABELS[user.accountType]}
                </Badge>
              </div>
            )}

            <Button
              type="button"
              onClick={() => setShowLogoutAllConfirm(true)}
              variant="outline"
              icon={LogOut}
              iconPlacement="left"
              loading={isRevoking}
              disabled={isLoading}
            >
              Odjavi se sa svih uređaja
            </Button>

            <Button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              variant="destructive"
              icon={Trash2}
              iconPlacement="left"
              loading={isDeleting}
              disabled={isLoading}
            >
              Obriši račun
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={showLogoutAllConfirm}
        onOpenChange={setShowLogoutAllConfirm}
        title="Odjava sa svih uređaja"
        description="Jeste li sigurni da se želite odjaviti sa svih ostalih uređaja? Ova sesija ostaje aktivna."
        confirmLabel="Odjavi se"
        variant="default"
        onConfirm={handleLogoutAll}
        isLoading={isRevoking}
      />

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Brisanje računa"
        description="Ova akcija se ne može poništiti. Svi vaši podaci bit će trajno obrisani."
        confirmLabel="Obriši račun"
        variant="destructive"
        onConfirm={handleDeleteUser}
        isLoading={isDeleting}
      />
    </>
  );
}
