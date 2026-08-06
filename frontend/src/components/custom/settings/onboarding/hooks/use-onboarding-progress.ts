"use client";

import { onlineManager } from "@tanstack/react-query";

import { userService } from "@/lib/api";
import { ONBOARDING_COMPLETED } from "@/lib/api/schemas/auth-user";
import { useUser } from "@/context/user-context";

/**
 * Persists the wizard's current step as an "skipped:<step>" outcome, so a reload
 * mid-onboarding resumes where the user left off instead of restarting.
 *
 * Deliberately its own mutation instance rather than a job in useSettingsSave:
 * that hook's isPending drives the wizard's busy flag, which would disable the
 * button the user just pressed. This one is fire-and-forget, and a lost ping
 * costs nothing more than one repeated step.
 */
export function useOnboardingProgress() {
  const { user, mergeUser } = useUser();
  const mutation = userService.useUpdateCurrentUser();

  function persist(step: number) {
    // Step 0 is persisted too. Returning early left skipped:1 stored after a
    // step back to the welcome step, so a reload resumed at the step the user
    // had just deliberately left.
    if (step < 0) return;
    if (!onlineManager.isOnline()) return;

    const outcome = `skipped:${step}`;
    if (!user || user.onboardingOutcome === outcome) return;

    // A progress ping must never downgrade a finished account. OnboardingGate
    // keys off "completed", so writing skipped:<step> over it replaces the URL
    // with an uncloseable required wizard the user cannot escape. Guarding here
    // rather than at the caller covers every route in, including a replay and a
    // stray swipe.
    if (user.onboardingOutcome === ONBOARDING_COMPLETED) return;

    mutation
      .mutateAsync({ onboardingOutcome: outcome })
      // Merged against the latest context value, not the `user` captured when
      // this ping was fired: anything that resolved in the meantime, including
      // the completion save, must not be rolled back by a slower progress write.
      .then((dto) => mergeUser({ onboardingOutcome: dto.onboardingOutcome }))
      .catch(() => {});
  }

  return { persist };
}
