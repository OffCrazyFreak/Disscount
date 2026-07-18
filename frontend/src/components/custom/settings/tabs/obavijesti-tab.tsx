"use client";

import { Bell } from "lucide-react";

import { StaggerChildren } from "@/components/ui/stagger-children";
import { SettingsSection } from "@/components/custom/settings/ui/settings-section";
import { NotificationSwitchRow } from "@/components/custom/settings/tabs/notification-switch-row";

const SWITCHES = [
  {
    name: "notificationsPush",
    label: "Dopusti obavijesti aplikacije",
    description:
      "Na mobilnu aplikaciju ćeš dobiti obavijesti za akcije o proizvodima koje odabereš.",
  },
  {
    name: "notificationsEmail",
    label: "Dopusti email obavijesti",
    description:
      "Na email ćeš dobiti obavijesti za akcije o proizvodima koje odabereš.",
  },
  {
    name: "newsletter",
    label: "Novosti i ažuriranja",
    description: "Povremene novosti o Disscountu na tvoj email.",
  },
  {
    name: "feedbackContact",
    label: "Kontakt za povratne informacije",
    description: "Dopusti da ti se javimo za povratne informacije o aplikaciji.",
  },
] as const;

export function ObavijestiTab() {
  return (
    <SettingsSection
      icon={Bell}
      label="Obavijesti"
      hint="Odaberi kako, o čemu i kada želiš biti obaviješten o akcijama i novostima."
    >
      <StaggerChildren className="divide-y">
        {SWITCHES.map((props) => (
          <NotificationSwitchRow key={props.name} {...props} />
        ))}
      </StaggerChildren>
    </SettingsSection>
  );
}
