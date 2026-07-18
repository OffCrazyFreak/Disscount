"use client";

import { useState } from "react";
import { TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SettingsSection } from "@/components/custom/settings/ui/settings-section";
import { SettingRow } from "@/components/custom/settings/ui/setting-row";
import { useSecurityActions } from "./security-actions";

export function DangerZone() {
  const { deleteAccount, deleting } = useSecurityActions();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <SettingsSection
      icon={TriangleAlert}
      label="Opasna zona"
      hint="Ova radnja je trajna i ne može se poništiti."
      destructive
    >
      <SettingRow
        destructive
        label="Obriši račun"
        description="Trajno briše tvoj račun i sve povezane podatke."
        control={
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={deleting}
            onClick={() => setConfirmOpen(true)}
          >
            Obriši račun
          </Button>
        }
      />

      <ConfirmDialog
        isOpen={confirmOpen}
        onOpenChange={setConfirmOpen}
        variant="destructive"
        title="Obrisati račun?"
        description="Tvoj račun i svi povezani podaci bit će nepovratno obrisani."
        confirmLabel="Obriši račun"
        onConfirm={deleteAccount}
        isLoading={deleting}
      />
    </SettingsSection>
  );
}
