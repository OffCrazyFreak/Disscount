"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import type { UserRequest } from "@/lib/api/schemas/auth-user";

import { userService } from "@/lib/api";
import { closeModalUrl } from "@/lib/modal/modal-navigation";
import { useUser } from "@/context/user-context";
import {
  SECTION_FIELDS,
  SettingsFormValues,
  SettingsSection,
} from "@/components/custom/settings/settings-schema";
import { ONBOARDING_STEPS } from "@/components/custom/settings/onboarding/onboarding-steps";

interface IUseOnboardingProps {
  open: boolean;
  save: (extraUserPatch?: Partial<UserRequest>) => Promise<boolean>;
}

export function useOnboarding({ open, save }: IUseOnboardingProps) {
  const form = useFormContext<SettingsFormValues>();
  const { setUser } = useUser();
  const userMutation = userService.useUpdateCurrentUser();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);

  // Restart from the first step every time the wizard opens.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setStep(0);
      setDirection(1);
    }
  }

  const currentStep = ONBOARDING_STEPS[step];
  const isLast = step === ONBOARDING_STEPS.length - 1;

  async function next() {
    // Form steps validate their own fields before advancing.
    const fields = SECTION_FIELDS[currentStep.id as SettingsSection];
    if (fields && !(await form.trigger(fields))) return;

    if (isLast) return;
    setDirection(1);
    setStep(step + 1);
  }

  function back() {
    if (step === 0) return;
    setDirection(-1);
    setStep(step - 1);
  }

  // Finishing routes through the settings save-all with the outcome stamped
  // into the same PATCH; failures reopen the settings modal on the failed tab.
  async function finish() {
    await save({ onboardingOutcome: "completed" });
  }

  // Skipping (button or X) stamps where the user bailed and closes for good.
  async function skip() {
    closeModalUrl();
    try {
      const updated = await userMutation.mutateAsync({
        onboardingOutcome: `skipped:${step}`,
      });
      setUser(updated);
    } catch {
      // Non-critical: the session gate still prevents re-pestering this tab.
    }
  }

  return {
    step,
    direction,
    currentStep,
    isLast,
    isFirst: step === 0,
    next,
    back,
    finish,
    skip,
    skipping: userMutation.isPending,
  };
}
