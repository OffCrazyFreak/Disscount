"use client";

import { useState } from "react";
import { Trash2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { userService } from "@/lib/api";
import { problemMessage } from "@/lib/api/problem-details";
import { authClient } from "@/lib/auth-client";
import { clearAuthToken } from "@/lib/api/api-base";
import { useUser } from "@/context/user-context";
import { closeModalUrl } from "@/lib/modal/modal-navigation";
import { SettingRow } from "@/components/custom/settings/ui/setting-row";

export function DangerZone() {
  const { setUser } = useUser();
  const queryClient = useQueryClient();

  const [isRevoking, setIsRevoking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showLogoutAllConfirm, setShowLogoutAllConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  async function handleLogoutAll() {
    setIsRevoking(true);
    setShowLogoutAllConfirm(false);

    try {
      const { error } = await authClient.revokeOtherSessions();
      if (error) {
        toast.error("Greška pri odjavi sa svih uređaja.");
        return;
      }

      toast.success("Odjavljen si sa svih ostalih uređaja!");
      closeModalUrl();
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
      const { error } = await authClient.deleteUser();
      if (error) {
        toast.error("Greška pri brisanju računa. Pokušaj ponovo.");
        return;
      }

      await userService.deleteCurrentUser();

      clearAuthToken();
      queryClient.clear();
      setUser(null);

      toast.success("Račun je uspješno obrisan!");
      closeModalUrl();
    } catch (error) {
      if (isAxiosError(error)) {
        const status = error.response?.status ?? 0;

        if (status === 404) {
          toast.error("Korisnički račun nije pronađen.");
        } else if (status >= 500) {
          toast.error("Serverska greška. Pokušaj ponovo.");
        } else {
          toast.error(problemMessage(error, "Greška pri brisanju računa."));
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
      <div className="divide-y">
        <SettingRow
          label="Odjava sa svih uređaja"
          description="Odjavi se sa svih ostalih uređaja osim ovog."
          control={
          <Button
            type="button"
            onClick={() => setShowLogoutAllConfirm(true)}
            variant="outline"
            size="sm"
            icon={LogOut}
            iconPlacement="left"
            loading={isRevoking}
            disabled={isLoading}
          >
            Odjava
          </Button>
        }
      />

      <SettingRow
        label="Obriši račun"
        description="Trajno obriši svoj račun i sve podatke."
        destructive
        control={
          <Button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            variant="destructive"
            size="sm"
            icon={Trash2}
            iconPlacement="left"
            loading={isDeleting}
            disabled={isLoading}
          >
            Obriši
          </Button>
        }
      />
      </div>

      <ConfirmDialog
        isOpen={showLogoutAllConfirm}
        onOpenChange={setShowLogoutAllConfirm}
        title="Odjava sa svih uređaja"
        description="Jesi li siguran da se želiš odjaviti sa svih ostalih uređaja? Ova sesija ostaje aktivna."
        confirmLabel="Odjava"
        variant="default"
        confirmIcon={LogOut}
        onConfirm={handleLogoutAll}
        isLoading={isRevoking}
      />

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Brisanje računa"
        description="Tvoj račun će biti trajno obrisan. Ova akcija se ne može poništiti."
        confirmLabel="Obriši račun"
        variant="destructive"
        onConfirm={handleDeleteUser}
        isLoading={isDeleting}
      />
    </>
  );
}
