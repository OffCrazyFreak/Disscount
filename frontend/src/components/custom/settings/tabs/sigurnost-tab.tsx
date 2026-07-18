"use client";

import { ShieldCheck, Link2, TriangleAlert, Loader2 } from "lucide-react";

import AccountCredentialsForm from "@/components/custom/header/forms/account-credentials-form";
import LinkedAccounts from "@/components/custom/header/forms/linked-accounts";
import { DangerZone } from "@/components/custom/settings/tabs/danger-zone";
import { SettingsSection } from "@/components/custom/settings/ui/settings-section";
import { StaggerChildren } from "@/components/ui/stagger-children";
import { useSecurity } from "@/components/custom/settings/tabs/security-context";

export function SigurnostTab() {
  const { status, accounts, reload } = useSecurity();

  return (
    <StaggerChildren className="space-y-8">
      {status === "pending" && (
        <div className="flex justify-center py-6">
          <Loader2 className="size-5 animate-spin text-primary" />
        </div>
      )}

      {status === "error" && (
        <p className="text-sm text-destructive">
          Greška pri dohvaćanju podataka o računu. Pokušaj ponovo.
        </p>
      )}

      {status === "success" && (
        <>
          <SettingsSection
            icon={ShieldCheck}
            label="Prijava i sigurnost"
            hint="Upravljaj emailom i lozinkom svog računa."
          >
            <AccountCredentialsForm />
          </SettingsSection>

          <SettingsSection
            icon={Link2}
            label="Povezani računi"
            hint="Poveži društvene račune za bržu prijavu."
          >
            <LinkedAccounts accounts={accounts} onChanged={reload} />
          </SettingsSection>
        </>
      )}

      <SettingsSection
        icon={TriangleAlert}
        label="Opasna zona"
        hint="Nepovratne radnje. Budi oprezan prije nego nastaviš."
        destructive
      >
        <DangerZone />
      </SettingsSection>
    </StaggerChildren>
  );
}
