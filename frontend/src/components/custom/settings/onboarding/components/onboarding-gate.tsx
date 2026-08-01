"use client";

import { useEffect } from "react";

import { useModalUrl } from "@/lib/modal/use-modal-url";
import { openModalUrl } from "@/lib/modal/modal-navigation";
import { ONBOARDING_COMPLETED } from "@/lib/api/schemas/auth-user";
import { useUser } from "@/context/user-context";

/**
 * Keeps required onboarding open until the user completes it. Historical
 * skipped outcomes remain incomplete and are sent through the required flow.
 */
export default function OnboardingGate() {
  const { target } = useModalUrl();
  const { user, isAuthenticated } = useUser();

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (user.onboardingOutcome === ONBOARDING_COMPLETED) return;
    if (target?.name === "onboarding" && target.mode === "required") return;

    openModalUrl({ name: "onboarding", mode: "required" }, { replace: true });
  }, [isAuthenticated, user, target]);

  return null;
}
