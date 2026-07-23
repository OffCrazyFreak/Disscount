"use client";

import { StaggerChildren } from "@/components/custom/animation/stagger-children";
import CredentialsForm from "@/components/custom/settings/security/components/credentials-form";
import LinkedAccounts from "@/components/custom/settings/security/components/linked-accounts";
import AccountActions from "@/components/custom/settings/security/components/account-actions";

export default function SecurityTab() {
  return (
    <StaggerChildren className="">
      <CredentialsForm />
      <LinkedAccounts />
      <AccountActions />
    </StaggerChildren>
  );
}
