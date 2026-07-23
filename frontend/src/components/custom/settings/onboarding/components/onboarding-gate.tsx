"use client";

import { useEffect, useRef } from "react";

import { useModalUrl } from "@/lib/modal/use-modal-url";
import { openModalUrl } from "@/lib/modal/modal-navigation";
import { useUser } from "@/context/user-context";

/**
 * Auto-opens the onboarding wizard once per browser session for users who have
 * never finished (or skipped) it. The skip/finish stamp on the user record
 * prevents it forever after.
 */
export default function OnboardingGate() {
  const { target } = useModalUrl();
  const { user, isAuthenticated } = useUser();
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    if (!isAuthenticated || !user) return;
    if (user.onboardingCompletedAt) return;
    // Never hijack a modal the user (or a deep link) already opened.
    if (target) return;

    firedRef.current = true;
    openModalUrl({ name: "onboarding" }, { replace: true });
  }, [isAuthenticated, user, target]);

  return null;
}
