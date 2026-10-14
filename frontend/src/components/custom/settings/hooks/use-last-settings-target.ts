"use client";

import { useState } from "react";

import type { ModalTarget, SettingsTab } from "@/lib/modal/modal-registry";

type OnboardingMode = Extract<ModalTarget, { name: "onboarding" }>["mode"];

/** The settings tab and onboarding mode last opened, kept after the URL drops them. */
export function useLastSettingsTarget(target: ModalTarget | null) {
  // Keeps the exit animation from flashing a different tab's content.
  const [lastTab, setLastTab] = useState<SettingsTab>("profil");
  if (target?.name === "settings" && target.tab !== lastTab) {
    setLastTab(target.tab);
  }

  // Same reason: falling back to "required" the moment the param is stripped
  // made the close button pop out of the header a frame before a replay wizard
  // finished fading, since ModalShell drives showCloseButton off preventClose.
  const [lastOnboardingMode, setLastOnboardingMode] =
    useState<OnboardingMode>("required");
  if (target?.name === "onboarding" && target.mode !== lastOnboardingMode) {
    setLastOnboardingMode(target.mode);
  }

  return { lastTab, lastOnboardingMode };
}
