"use client";

import { Bell } from "lucide-react";
import { useTranslations } from "next-intl";

import { StaggerChildren } from "@/components/custom/animation/stagger-children";
import SettingsSection from "@/components/custom/settings/ui/settings-section";
import NotificationSwitchRow from "@/components/custom/settings/components/notification-switch-row";

const SWITCHES = [
  {
    name: "notificationsPush",
    labelKey: "notifications.push.label",
    descriptionKey: "notifications.push.description",
    comingSoon: true,
  },
  {
    name: "notificationsEmail",
    labelKey: "notifications.email.label",
    descriptionKey: "notifications.email.description",
    comingSoon: true,
  },
  {
    name: "newsletter",
    labelKey: "notifications.newsletter.label",
    descriptionKey: "notifications.newsletter.description",
    comingSoon: true,
  },
  {
    name: "feedbackContact",
    labelKey: "notifications.feedback.label",
    descriptionKey: "notifications.feedback.description",
  },
] as const;

export default function NotificationsTab() {
  const t = useTranslations("settings");

  return (
    <SettingsSection
      icon={Bell}
      label={t("tabs.notifications")}
      hint={t("notifications.hint")}
    >
      <StaggerChildren className="divide-y">
        {SWITCHES.map((item) => (
          <NotificationSwitchRow
            key={item.name}
            name={item.name}
            label={t(item.labelKey)}
            description={t(item.descriptionKey)}
            comingSoon={"comingSoon" in item}
          />
        ))}
      </StaggerChildren>
    </SettingsSection>
  );
}
