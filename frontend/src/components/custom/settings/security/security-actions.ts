"use client";

import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { authClient } from "@/lib/auth/client";
import { useUser } from "@/context/user-context";
import {
  proofFailureFrom,
  type IProofFailure,
  type ReauthProof,
} from "@/components/custom/settings/security/reauth/reauth-requests";

export function useSecurityActions() {
  const t = useTranslations("settings");
  const router = useRouter();
  const { logout } = useUser();
  const [revoking, setRevoking] = useState(false);

  async function revokeOtherSessions() {
    setRevoking(true);
    const { error } = await authClient.revokeOtherSessions();
    setRevoking(false);

    if (error) {
      toast.error(t("security.actions.revokeFailed"));
      return false;
    }
    toast.success(t("security.actions.revoked"));
    return true;
  }

  // The server checks the proof, then erases backend data, then the identity, so a refusal leaves the account whole.
  async function deleteAccount(
    proof: ReauthProof,
  ): Promise<IProofFailure | null> {
    const { error } = await authClient.$fetch("/delete-user", {
      method: "POST",
      body: proof,
    });
    if (error) return proofFailureFrom(error);

    await logout();
    router.replace("/");
    toast.success(t("security.actions.deleted"));
    return null;
  }

  return { revokeOtherSessions, deleteAccount, revoking };
}
