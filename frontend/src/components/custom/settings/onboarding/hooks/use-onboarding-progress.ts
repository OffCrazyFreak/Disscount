"use client";

import { onlineManager } from "@tanstack/react-query";

import { userService } from "@/lib/api";
import { ONBOARDING_COMPLETED } from "@/lib/api/schemas/auth-user";
import { useUser } from "@/context/user-context";

/** Its own mutation, because useSettingsSave's isPending would disable the pressed button. */
export function useOnboardingProgress() {
  const { user, mergeUser } = useUser();
  const mutation = userService.useUpdateCurrentUser();

  function persist(step: number) {
    // Step 0 is persisted too, or a reload would resume at the step the user just deliberately left.
    if (step < 0) return;
    if (!onlineManager.isOnline()) return;

    const outcome = `skipped:${step}`;
    if (!user || user.onboardingOutcome === outcome) return;

    // skipped:<step> over a finished account would trap it in an uncloseable required wizard.
    if (user.onboardingOutcome === ONBOARDING_COMPLETED) return;

    mutation
      .mutateAsync({ onboardingOutcome: outcome })
      // Merged against the latest value, so a slow write cannot roll back the completion save.
      .then((dto) => mergeUser({ onboardingOutcome: dto.onboardingOutcome }))
      .catch(() => {});
  }

  return { persist };
}
