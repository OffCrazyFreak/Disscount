"use client";

import { useTranslations } from "next-intl";
import { UserRound, Bell, Store, LucideIcon } from "lucide-react";

import { StaggerChildren } from "@/components/custom/animation/stagger-children";

const HIGHLIGHTS = [
  {
    icon: UserRound,
    titleKey: "onboarding.welcome.profile.title",
    textKey: "onboarding.welcome.profile.text",
  },
  {
    icon: Store,
    titleKey: "onboarding.welcome.stores.title",
    textKey: "onboarding.welcome.stores.text",
  },
  {
    icon: Bell,
    titleKey: "onboarding.welcome.notifications.title",
    textKey: "onboarding.welcome.notifications.text",
  },
] as const satisfies readonly {
  icon: LucideIcon;
  titleKey: string;
  textKey: string;
}[];

export default function WelcomeStep() {
  const t = useTranslations("settings");

  return (
    <div className="space-y-6 py-2">
      <p className="text-sm text-muted-foreground text-pretty">
        {t("onboarding.welcome.intro")}
      </p>

      <StaggerChildren className="space-y-5">
        {HIGHLIGHTS.map(({ icon: Icon, titleKey, textKey }) => (
          <div key={titleKey} className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon className="size-6" />
            </div>
            <div>
              <p className="text-sm font-medium">{t(titleKey)}</p>
              <p className="text-xs text-muted-foreground">{t(textKey)}</p>
            </div>
          </div>
        ))}
      </StaggerChildren>
    </div>
  );
}
