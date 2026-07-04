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
import { useTranslations } from "next-intl";

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
  const t = useTranslations("settings.security");

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
        toast.error(t("logoutAllError"));
        return;
      }

      toast.success(t("logoutAllSuccess"));
      onOpenChange(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("unknownError");
      toast.error(t("logoutAllErrorDetail", { message }));
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
        toast.error(t("deleteError"));
        return;
      }

      await userService.deleteCurrentUser();

      clearAuthToken();
      queryClient.clear();
      setUser(null);

      toast.success(t("deleteSuccess"));
      onOpenChange(false);
    } catch (error) {
      if (isAxiosError(error)) {
        const status = error.response?.status ?? 0;
        const serverMessage = (error.response?.data as { message?: string })
          ?.message;

        if (status === 404) {
          toast.error(t("userNotFound"));
        } else if (status >= 500) {
          toast.error(t("serverError"));
        } else {
          toast.error(serverMessage || t("deleteErrorGeneric"));
        }
      } else {
        toast.error(t("deleteErrorNetwork"));
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
            <DialogTitle className="text-xl">{t("title")}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-6">
            {accountsStatus === "pending" && (
              <div className="flex justify-center py-6">
                <Loader2 className="size-5 animate-spin text-primary" />
              </div>
            )}

            {accountsStatus === "error" && (
              <p className="text-sm text-destructive">{t("loadError")}</p>
            )}

            {accountsStatus === "success" && (
              <>
                <section className="space-y-3">
                  <SectionLabel icon={ShieldCheck}>
                    {t("loginSection")}
                  </SectionLabel>

                  <AccountCredentialsForm
                    hasPassword={hasPassword}
                    hasLinkedSocial={hasLinkedSocial}
                    onChanged={reloadAccounts}
                  />
                </section>

                <section className="space-y-3">
                  <SectionLabel icon={Link2}>{t("linkedSection")}</SectionLabel>
                  <LinkedAccounts accounts={accounts} onChanged={reloadAccounts} />
                </section>
              </>
            )}

            <section className="space-y-4">
              <SectionLabel icon={TriangleAlert} className="text-destructive">
                {t("dangerZone")}
              </SectionLabel>

              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{t("logoutAllTitle")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("logoutAllHint")}
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
                  {t("logoutAll")}
                </Button>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{t("deleteAccountTitle")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("deleteAccountHint")}
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
                  {t("deleteAccount")}
                </Button>
              </div>
            </section>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={showLogoutAllConfirm}
        onOpenChange={setShowLogoutAllConfirm}
        title={t("logoutAllTitle")}
        description={t("logoutAllConfirmDesc")}
        confirmLabel={t("logoutAll")}
        variant="default"
        onConfirm={handleLogoutAll}
        isLoading={isRevoking}
      />

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title={t("deleteConfirmTitle")}
        description={t("deleteConfirmDesc")}
        confirmLabel={t("deleteConfirm")}
        variant="destructive"
        onConfirm={handleDeleteUser}
        isLoading={isDeleting}
      />
    </>
  );
}
