"use client";

import { useEffect } from "react";

import { useModalUrl } from "@/lib/modal/use-modal-url";
import { openModalUrl } from "@/lib/modal/modal-navigation";
import { isPublicModal } from "@/lib/modal/modal-registry";
import { ONBOARDING_COMPLETED } from "@/lib/api/schemas/auth-user";
import { useUser } from "@/context/user-context";

/** Skipped outcomes count as incomplete, so they are sent through the required flow. */
export default function OnboardingGate() {
  const { target } = useModalUrl();
  const { user, isAuthenticated } = useUser();

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (user.onboardingOutcome === ONBOARDING_COMPLETED) return;
    if (target?.name === "onboarding" && target.mode === "required") return;

    // Never pre-empt a linked modal, because replacing email-verified or reset-password stops the user finishing; the wizard returns after it closes.
    if (target && isPublicModal(target.name)) return;

    openModalUrl({ name: "onboarding", mode: "required" }, { replace: true });
  }, [isAuthenticated, user, target]);

  return null;
}
