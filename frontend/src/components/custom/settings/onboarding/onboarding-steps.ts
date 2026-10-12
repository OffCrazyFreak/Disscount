"use client";

import { ComponentType } from "react";

import ProfileTab from "@/components/custom/settings/tabs/profile-tab";
import NotificationsTab from "@/components/custom/settings/tabs/notifications-tab";
import PreferencesTab from "@/components/custom/settings/tabs/preferences-tab";
import WelcomeStep from "@/components/custom/settings/onboarding/components/welcome-step";
import DoneStep from "@/components/custom/settings/onboarding/components/done-step";

type StepTitleKey =
  | "onboarding.steps.welcome.title"
  | "onboarding.steps.profile.title"
  | "onboarding.steps.notifications.title"
  | "onboarding.steps.preferences.title"
  | "onboarding.steps.done.title";

type StepDescriptionKey =
  | "onboarding.steps.profile.description"
  | "onboarding.steps.notifications.description"
  | "onboarding.steps.preferences.description";

export interface IOnboardingStep {
  id: string;
  titleKey: StepTitleKey;
  // Set when the step greets the user by name; resolved in useOnboarding.
  namedTitleKey?: "onboarding.steps.welcome.titleNamed";
  descriptionKey?: StepDescriptionKey;
  component: ComponentType;
}

// The middle steps ARE the settings tabs - same components, same form context.
export const ONBOARDING_STEPS: IOnboardingStep[] = [
  {
    id: "welcome",
    titleKey: "onboarding.steps.welcome.title",
    namedTitleKey: "onboarding.steps.welcome.titleNamed",
    component: WelcomeStep,
  },
  {
    id: "profil",
    titleKey: "onboarding.steps.profile.title",
    descriptionKey: "onboarding.steps.profile.description",
    component: ProfileTab,
  },
  {
    id: "obavijesti",
    titleKey: "onboarding.steps.notifications.title",
    descriptionKey: "onboarding.steps.notifications.description",
    component: NotificationsTab,
  },
  {
    id: "preference",
    titleKey: "onboarding.steps.preferences.title",
    descriptionKey: "onboarding.steps.preferences.description",
    component: PreferencesTab,
  },
  {
    id: "done",
    titleKey: "onboarding.steps.done.title",
    component: DoneStep,
  },
];
