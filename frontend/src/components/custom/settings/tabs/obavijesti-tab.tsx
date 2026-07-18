"use client";

import { StaggerChildren } from "@/components/ui/stagger-children";
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
    <StaggerChildren className="space-y-4">
      {SWITCHES.map((props) => (
        <NotificationSwitchRow key={props.name} {...props} />
      ))}
    </StaggerChildren>
  );
}
