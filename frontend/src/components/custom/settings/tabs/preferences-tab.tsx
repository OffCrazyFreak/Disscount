"use client";

import { Store, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";

import { StaggerChildren } from "@/components/custom/animation/stagger-children";
import SettingsSection from "@/components/custom/settings/ui/settings-section";
import PinnedStoresGrid from "@/components/custom/settings/components/pinned-stores-grid";
import PinnedPlacesSelect from "@/components/custom/settings/components/pinned-places-select";

export default function PreferencesTab() {
  const t = useTranslations("settings");

  return (
    <StaggerChildren className="space-y-8">
      <SettingsSection
        icon={Store}
        label={t("preferences.stores.label")}
        hint={t("preferences.stores.hint")}
      >
        <PinnedStoresGrid />
      </SettingsSection>

      <SettingsSection
        icon={MapPin}
        label={t("preferences.places.label")}
        hint={t("preferences.places.hint")}
      >
        <PinnedPlacesSelect />
      </SettingsSection>
    </StaggerChildren>
  );
}
