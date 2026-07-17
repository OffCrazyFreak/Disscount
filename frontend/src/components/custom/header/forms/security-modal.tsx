"use client";

import { useState } from "react";
import {
  Trash2,
  LogOut,
  ShieldCheck,
  Link2,
  TriangleAlert,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import AccountCredentialsForm from "@/components/custom/header/forms/account-credentials-form";
import LinkedAccounts from "@/components/custom/header/forms/linked-accounts";
import { userService } from "@/lib/api";
import { problemMessage } from "@/lib/api/problem-details";
import { authClient } from "@/lib/auth-client";
import { clearAuthToken } from "@/lib/api/api-base";
import { useUser } from "@/context/user-context";
import { cn } from "@/lib/utils";

interface LinkedAccount {
  providerId: string;
  accountId: string;
}

function SectionLabel({
  icon: Icon,
  className,
  children,
}: {
  icon: LucideIcon;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground",
        className,
      )}
    >
      <Icon className="size-3.5" />
      {children}
    </div>
  );
}

interface ISecurityModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SecurityModal({
  isOpen,
  onOpenChange,
}: ISecurityModalProps) {
  const { setUser } = useUser();
  const queryClient = useQueryClient();

  const [isRevoking, setIsRevoking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showLogoutAllConfirm, setShowLogoutAllConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch linked accounts when the modal opens (React Query, the codebase standard) — no
  // state-setting effect. reloadAccounts is handed to children to refresh after link/unlink.
  const {
    data: accounts = [],
    status: accountsStatus,
    refetch: reloadAccounts,
  } = useQuery({
    queryKey: ["linked-accounts"],
    enabled: isOpen,
    queryFn: async (): Promise<LinkedAccount[]> => {
      const { data, error } = await authClient.listAccounts();
      if (error || !data) {
        throw new Error("Failed to load accounts");
      }
      return data.map((a) => ({
        providerId: a.providerId,
        accountId: a.accountId,
      }));
    },
  });

  const hasPassword = accounts.some((a) => a.providerId === "credential");
  const hasLinkedSocial = accounts.some((a) => a.providerId !== "credential");

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
      onOpenChange(false);
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
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Sigurnost</DialogTitle>
            <DialogDescription>
              Upravljaj prijavama i svojim računom.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-6">
            {accountsStatus === "pending" && (
              <div className="flex justify-center py-6">
                <Loader2 className="size-5 animate-spin text-primary" />
              </div>
            )}

            {accountsStatus === "error" && (
              <p className="text-sm text-destructive">
                Greška pri dohvaćanju podataka o računu. Pokušaj ponovo.
              </p>
            )}

            {accountsStatus === "success" && (
              <>
                <section className="space-y-3">
                  <SectionLabel icon={ShieldCheck}>
                    Prijava i sigurnost
                  </SectionLabel>

                  <AccountCredentialsForm
                    hasPassword={hasPassword}
                    hasLinkedSocial={hasLinkedSocial}
                    onChanged={reloadAccounts}
                  />
                </section>

                <section className="space-y-3">
                  <SectionLabel icon={Link2}>Povezani računi</SectionLabel>
                  <LinkedAccounts accounts={accounts} onChanged={reloadAccounts} />
                </section>
              </>
            )}

            <section className="space-y-4">
              <SectionLabel icon={TriangleAlert} className="text-destructive">
                Opasna zona
              </SectionLabel>

              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Odjava sa svih uređaja</p>
                  <p className="text-xs text-muted-foreground">
                    Odjavi se sa svih ostalih uređaja osim ovog.
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={() => setShowLogoutAllConfirm(true)}
                  variant="outline"
                  size="sm"
                  icon={LogOut}
                  iconPlacement="left"
                  loading={isRevoking}
                  disabled={isLoading}
                  className="shrink-0"
                >
                  Odjava
                </Button>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Obriši račun</p>
                  <p className="text-xs text-muted-foreground">
                    Trajno obriši svoj račun i sve podatke.
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  variant="destructive"
                  size="sm"
                  icon={Trash2}
                  iconPlacement="left"
                  loading={isDeleting}
                  disabled={isLoading}
                  className="shrink-0"
                >
                  Obriši
                </Button>
              </div>
            </section>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={showLogoutAllConfirm}
        onOpenChange={setShowLogoutAllConfirm}
        title="Odjava sa svih uređaja"
        description="Jeste li sigurni da se želite odjaviti sa svih ostalih uređaja? Ova sesija ostaje aktivna."
        confirmLabel="Odjava"
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
