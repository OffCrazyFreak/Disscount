"use client";

import { MonitorSmartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SettingsSection } from "@/components/custom/settings/ui/settings-section";
import { SettingRow } from "@/components/custom/settings/ui/setting-row";
import { useSecurityActions } from "./security-actions";

export function SessionsSection() {
  const { revokeOtherSessions, revoking } = useSecurityActions();

  return (
    <SettingsSection
      icon={MonitorSmartphone}
      label="Uređaji i sesije"
      hint="Upravljaj prijavama na drugim uređajima."
    >
      <SettingRow
        label="Odjava s ostalih uređaja"
        description="Zatvori sve aktivne prijave osim ove trenutne."
        control={
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={revoking}
            onClick={revokeOtherSessions}
          >
            Odjavi
          </Button>
        }
      />
    </SettingsSection>
  );
}
