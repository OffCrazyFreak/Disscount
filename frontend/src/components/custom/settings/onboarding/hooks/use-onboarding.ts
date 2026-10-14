"use client";

import { useTranslations } from "next-intl";
import { useFormContext, useFormState, useWatch } from "react-hook-form";

import {
  SECTION_FIELDS,
  SettingsFormValues,
  SettingsSection,
} from "@/components/custom/settings/settings-schema";
import { ONBOARDING_STEPS } from "@/components/custom/settings/onboarding/onboarding-steps";
import { useOnboardingStep } from "@/components/custom/settings/onboarding/hooks/use-onboarding-step";
import { useOnboardingProgress } from "@/components/custom/settings/onboarding/hooks/use-onboarding-progress";

interface IUseOnboardingProps {
  open: boolean;
  save: () => Promise<boolean>;
}

export function useOnboarding({ open, save }: IUseOnboardingProps) {
  const t = useTranslations("settings");
  const form = useFormContext<SettingsFormValues>();
  const { errors } = useFormState({ control: form.control });
  const { persist } = useOnboardingProgress();
  const { step, setStep, direction, setDirection } = useOnboardingStep(open);

  const currentStep = ONBOARDING_STEPS[step];
  const isLast = step === ONBOARDING_STEPS.length - 1;

  // The live form value, so a username edited on the profile step greets correctly.
  const username = useWatch({ control: form.control, name: "username" });
  const trimmedUsername = username?.trim() ?? "";
  const title =
    currentStep.namedTitleKey && trimmedUsername
      ? t(currentStep.namedTitleKey, { username: trimmedUsername })
      : t(currentStep.titleKey);

  async function next() {
    // Form steps validate their own fields before advancing.
    const fields = SECTION_FIELDS[currentStep.id as SettingsSection];
    if (fields && !(await form.trigger(fields))) return;

    if (isLast) return;
    setDirection(1);
    setStep(step + 1);
    persist(step + 1);
  }

  function back() {
    if (step === 0) return;
    setDirection(-1);
    setStep(step - 1);
    persist(step - 1);
  }

  async function finish() {
    const saved = await save();
    if (saved) return;

    const failedStep = ONBOARDING_STEPS.findIndex(({ id }) => {
      const fields = SECTION_FIELDS[id as SettingsSection];
      return fields?.some((field) => form.getFieldState(field).invalid);
    });

    if (failedStep >= 0) {
      setDirection(-1);
      setStep(failedStep);
    }
  }

  return {
    step,
    direction,
    currentStep,
    title,
    isLast,
    isFirst: step === 0,
    next,
    back,
    finish,
    description: currentStep.descriptionKey
      ? t(currentStep.descriptionKey)
      : undefined,
    rootError: errors.root?.message,
  };
}
