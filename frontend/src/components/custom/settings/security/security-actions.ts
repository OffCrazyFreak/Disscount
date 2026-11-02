"use client";

import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { authClient } from "@/lib/auth/client";
import fetchAuthToken from "@/lib/auth/token";
import { userService } from "@/lib/api";
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
      // Taken first because deleting the identity ends the session that mints backend tokens.
      const token = await fetchAuthToken();
      if (!token) throw new Error("no backend token");

      // Identity first: better-auth refuses a stale session before deleting anything, and ends
      // every session, so no new token can be minted to revive the profile afterwards.
      const { error } = await authClient.deleteUser();
      if (error) throw new Error(error.message ?? "delete failed");
      // This tab's cached token outlives the identity; a request using it would revive the profile.
      clearAuthToken();

      // The identity is gone either way, so this tab signs out even if the profile delete fails.
      try {
        await userService.deleteCurrentUser(token);
      } finally {
        await logout();
        router.replace("/");
      }

      toast.success(t("security.actions.deleted"));
    } catch {
      toast.error(t("security.actions.deleteFailed"));
    } finally {
      setDeleting(false);
    }
  }

  return { revokeOtherSessions, deleteAccount, revoking, deleting };
}
