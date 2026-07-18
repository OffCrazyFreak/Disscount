"use client";

import { StaggerChildren } from "@/components/ui/stagger-children";
import { CredentialsForm } from "./credentials-form";
import { LinkedAccounts } from "./linked-accounts";
import { SessionsSection } from "./sessions-section";
import { DangerZone } from "./danger-zone";

export function SecurityTab() {
  return (
    <StaggerChildren className="space-y-8">
      <CredentialsForm />
      <LinkedAccounts />
      <SessionsSection />
      <DangerZone />
    </StaggerChildren>
  );
}
