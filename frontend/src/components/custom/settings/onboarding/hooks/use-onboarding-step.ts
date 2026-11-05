"use client";

import { useState } from "react";

import { useUser } from "@/context/user-context";
import { ONBOARDING_STEPS } from "@/components/custom/settings/onboarding/onboarding-steps";

function resumeStepFromOutcome(outcome: string | null | undefined) {
  const match = outcome?.match(/^skipped:(\d+)$/);
  if (!match) return 0;

  return Math.min(Number.parseInt(match[1], 10), ONBOARDING_STEPS.length - 1);
}

export function useOnboardingStep(open: boolean) {
  const { user } = useUser();
  const resumeStep = resumeStepFromOutcome(user?.onboardingOutcome);

  const [step, setStep] = useState(resumeStep);
  const [direction, setDirection] = useState<1 | -1>(1);

  // Once per opening with the user known, because a refreshed URL can mount before the profile.
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

  return { step, setStep, direction, setDirection };
}
