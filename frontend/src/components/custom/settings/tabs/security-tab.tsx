"use client";

import { StaggerChildren } from "@/components/custom/animation/stagger-children";
import CredentialsForm from "@/components/custom/settings/security/components/credentials-form";
import LinkedAccounts from "@/components/custom/settings/security/components/linked-accounts";
import AccountActions from "@/components/custom/settings/security/components/account-actions";
import ReauthDialog from "@/components/custom/settings/security/reauth/reauth-dialog";
import { useSecurity } from "@/components/custom/settings/security/security-context";
import { useUser } from "@/context/user-context";

export default function SecurityTab() {
  const { reauth, recovery } = useSecurity();
  const { user } = useUser();

  return (
    <>
      <StaggerChildren className="">
        <CredentialsForm />
        <LinkedAccounts />
        <AccountActions />
      </StaggerChildren>

      <ReauthDialog
        reauth={reauth}
        email={user?.email ?? ""}
        onForgotPassword={recovery.send}
        isSendingRecovery={recovery.sending}
      />
    </>
  );
}
