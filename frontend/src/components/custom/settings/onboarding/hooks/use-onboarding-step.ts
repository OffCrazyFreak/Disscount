"use client";

import { useState } from "react";

import { useUser } from "@/context/user-context";
import { ONBOARDING_STEPS } from "@/components/custom/settings/onboarding/onboarding-steps";

function resumeStepFromOutcome(outcome: string | null | undefined) {
  const match = outcome?.match(/^skipped:(\d+)$/);
  if (!match) return 0;

  return Math.min(Number.parseInt(match[1], 10), ONBOARDING_STEPS.length - 1);
}

/** The wizard's current step and slide direction, resumed on every opening. */
export function useOnboardingStep(open: boolean) {
  const { user } = useUser();
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

  return { step, setStep, direction, setDirection };
}
