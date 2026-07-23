"use client";

import { ComponentType } from "react";

import ProfileTab from "@/components/custom/settings/tabs/profile-tab";
import NotificationsTab from "@/components/custom/settings/tabs/notifications-tab";
import PreferencesTab from "@/components/custom/settings/tabs/preferences-tab";
import WelcomeStep from "@/components/custom/settings/onboarding/components/welcome-step";
import DoneStep from "@/components/custom/settings/onboarding/components/done-step";

export interface IOnboardingStep {
  id: string;
  title: string;
  description?: string;
  component: ComponentType;
}

// The middle steps ARE the settings tabs - same components, same form context.
export const ONBOARDING_STEPS: IOnboardingStep[] = [
  {
    id: "welcome",
    title: "Drago nam je što si tu",
    component: WelcomeStep,
  },
  {
    id: "profil",
    title: "Tvoj profil",
    description: "Predstavi se - sve možeš kasnije promijeniti u postavkama.",
    component: ProfileTab,
  },
  {
    id: "obavijesti",
    title: "Obavijesti",
    description:
      "Odaberi kako, o čemu i kada želiš primati obavijesti o akcijama i novostima.",
    component: NotificationsTab,
  },
  {
    id: "preference",
    title: "Tvoje trgovine i lokacije",
    description:
      "Označi trgovine i mjesta u svojoj blizini za točnije usporedbe cijena.",
    component: PreferencesTab,
  },
  {
    id: "done",
    title: "Sve je spremno!",
    component: DoneStep,
  },
];
