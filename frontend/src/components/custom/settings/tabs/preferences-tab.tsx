"use client";

import { Store, MapPin } from "lucide-react";

import { StaggerChildren } from "@/components/ui/stagger-children";
import SettingsSection from "@/components/custom/settings/ui/settings-section";
import PinnedStoresGrid from "@/components/custom/settings/components/pinned-stores-grid";
import PinnedPlacesSelect from "@/components/custom/settings/components/pinned-places-select";

export default function PreferencesTab() {
  return (
    <StaggerChildren className="space-y-8">
      <SettingsSection
        icon={Store}
        label="Trgovine"
        hint="Odaberi trgovine u tvojoj blizini."
      >
        <PinnedStoresGrid />
      </SettingsSection>

      <SettingsSection
        icon={MapPin}
        label="Lokacije"
        hint="Odaberi lokacije u tvojoj blizini."
      >
        <PinnedPlacesSelect />
      </SettingsSection>
    </StaggerChildren>
  );
}
