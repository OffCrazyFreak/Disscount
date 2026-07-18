"use client";

import { ComponentType } from "react";

import { ProfilTab } from "@/components/custom/settings/tabs/profil-tab";
import { ObavijestiTab } from "@/components/custom/settings/tabs/obavijesti-tab";
import { PreferenceTab } from "@/components/custom/settings/tabs/preference-tab";
import { WelcomeStep } from "@/components/custom/settings/onboarding/welcome-step";
import { DoneStep } from "@/components/custom/settings/onboarding/done-step";

export interface OnboardingStep {
  id: string;
  title: string;
  description?: string;
  component: ComponentType;
}

// The middle steps ARE the settings tabs — same components, same form context.
export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Dobrodošli u Disscount",
    component: WelcomeStep,
  },
  {
    id: "profil",
    title: "Tvoj profil",
    description: "Predstavi se — sve možeš kasnije promijeniti u postavkama.",
    component: ProfilTab,
  },
  {
    id: "obavijesti",
    title: "Obavijesti",
    description: "Odaberi koje obavijesti želiš primati.",
    component: ObavijestiTab,
  },
  {
    id: "preference",
    title: "Tvoje trgovine i lokacije",
    description:
      "Označi trgovine i mjesta u svojoj blizini za točnije usporedbe cijena.",
    component: PreferenceTab,
  },
  {
    id: "done",
    title: "Sve je spremno!",
    component: DoneStep,
  },
];
