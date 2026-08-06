"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";

import { useUser } from "@/context/user-context";
import {
  SECTION_FIELDS,
  SettingsFormValues,
  SettingsSection,
} from "@/components/custom/settings/settings-schema";
import { ONBOARDING_STEPS } from "@/components/custom/settings/onboarding/onboarding-steps";
import { useOnboardingProgress } from "@/components/custom/settings/onboarding/hooks/use-onboarding-progress";

interface IUseOnboardingProps {
  open: boolean;
  save: () => Promise<boolean>;
}

function resumeStepFromOutcome(outcome: string | null | undefined) {
  const match = outcome?.match(/^skipped:(\d+)$/);
  if (!match) return 0;

  return Math.min(Number.parseInt(match[1], 10), ONBOARDING_STEPS.length - 1);
}

export function useOnboarding({ open, save }: IUseOnboardingProps) {
  const form = useFormContext<SettingsFormValues>();
  const { user } = useUser();
  const { persist } = useOnboardingProgress();
  const resumeStep = resumeStepFromOutcome(user?.onboardingOutcome);

  const [step, setStep] = useState(resumeStep);
  const [direction, setDirection] = useState<1 | -1>(1);

  // Required onboarding resumes historical skipped flows. Completed users who
  // replay the guide still begin from the welcome step.
  //
  // Resume runs once per opening, and only once the user is known: the wizard
  // can mount with open already true from a refreshed ?modal=onboarding URL,
  // before the profile has loaded, which would otherwise lock in step 0 with no
  // later transition to correct it. Resuming once rather than tracking the
  // outcome also keeps a persist() write from dragging the step backwards.
  const [prevOpen, setPrevOpen] = useState(open);
  const [hasResumed, setHasResumed] = useState(open && !!user);

  if (open !== prevOpen) {
    setPrevOpen(open);
    setHasResumed(open && !!user);
    if (open) {
      setStep(resumeStep);
      setDirection(1);
    }
  } else if (open && !hasResumed && user) {
    setHasResumed(true);
    setStep(resumeStep);
    setDirection(1);
  }

  const currentStep = ONBOARDING_STEPS[step];
  const isLast = step === ONBOARDING_STEPS.length - 1;

  // The live form value, so a username edited on the profile step greets correctly.
  const username = form.watch("username");
  const title =
    typeof currentStep.title === "function"
      ? currentStep.title(username?.trim() ?? "")
      : currentStep.title;

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
    rootError: form.formState.errors.root?.message,
  };
}
