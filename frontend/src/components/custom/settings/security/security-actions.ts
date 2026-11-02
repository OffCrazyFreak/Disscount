"use client";

import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { authClient } from "@/lib/auth/client";
import { clearAuthToken } from "@/lib/api/api-base";
import { useUser } from "@/context/user-context";

// The Sigurnost actions that sit outside the credentials form.
export function useSecurityActions() {
  const t = useTranslations("settings");
  const router = useRouter();
  const { logout } = useUser();
  const [revoking, setRevoking] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function revokeOtherSessions() {
    setRevoking(true);
    const { error } = await authClient.revokeOtherSessions();
    setRevoking(false);

    if (error) {
      toast.error(t("security.actions.revokeFailed"));
      return;
    }
    toast.success(t("security.actions.revoked"));
  }

  async function deleteAccount() {
    setDeleting(true);
    try {
      // The server erases the backend data inside deleteUser for the session's own user and
      // deletes the identity only after that, so a refusal leaves the account safe to retry.
      const { error } = await authClient.deleteUser();
      if (error) throw new Error(error.message ?? "delete failed");
      // This tab's cached token outlives the identity; requests using it would only get account_erased.
      clearAuthToken();

      await logout();
      router.replace("/");
      toast.success(t("security.actions.deleted"));
    } catch {
      toast.error(t("security.actions.deleteFailed"));
    } finally {
      setDeleting(false);
    }
  }

  return { revokeOtherSessions, deleteAccount, revoking, deleting };
}
