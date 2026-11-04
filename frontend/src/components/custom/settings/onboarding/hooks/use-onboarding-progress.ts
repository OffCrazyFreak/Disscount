"use client";

import { onlineManager } from "@tanstack/react-query";

import { userService } from "@/lib/api";
import { ONBOARDING_COMPLETED } from "@/lib/api/schemas/auth-user";
import { useUser } from "@/context/user-context";

/** Its own mutation, because useSettingsSave's isPending would disable the pressed button; a lost ping costs one repeated step. */
export function useOnboardingProgress() {
  const { user, mergeUser } = useUser();
  const mutation = userService.useUpdateCurrentUser();

  function persist(step: number) {
    // Step 0 is persisted too, or a reload would resume at the step the user just deliberately left.
    if (step < 0) return;
    if (!onlineManager.isOnline()) return;

    const outcome = `skipped:${step}`;
    if (!user || user.onboardingOutcome === outcome) return;

    // A ping must never downgrade a finished account, because skipped:<step> would trap them in an uncloseable required wizard.
    if (user.onboardingOutcome === ONBOARDING_COMPLETED) return;

    mutation
      .mutateAsync({ onboardingOutcome: outcome })
      // Merged against the latest context value, so a slower progress write cannot roll back something resolved meanwhile, like the completion save.
      .then((dto) => mergeUser({ onboardingOutcome: dto.onboardingOutcome }))
      .catch(() => {});
  }

  return { persist };
}
