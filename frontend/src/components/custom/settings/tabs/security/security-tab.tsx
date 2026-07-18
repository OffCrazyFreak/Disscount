"use client";

import { StaggerChildren } from "@/components/ui/stagger-children";
import CredentialsForm from "@/components/custom/settings/tabs/security/credentials-form";
import LinkedAccounts from "@/components/custom/settings/tabs/security/linked-accounts";
import AccountActions from "@/components/custom/settings/tabs/security/account-actions";

export default function SecurityTab() {
  return (
    <StaggerChildren className="">
      <CredentialsForm />
      <LinkedAccounts />
      <AccountActions />
    </StaggerChildren>
  );
}
