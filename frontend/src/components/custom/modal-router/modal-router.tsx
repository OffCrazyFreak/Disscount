"use client";

import { useState } from "react";

import AuthModal, { AuthMode } from "@/components/custom/auth/auth-modal";
import EntityModalOutlet, {
  isEntityTarget,
} from "@/components/custom/modal-router/entity-modal-outlet";
import SettingsModalHost from "@/components/custom/settings/settings-modal-host";
import OnboardingGate from "@/components/custom/settings/onboarding/components/onboarding-gate";
import ResetPasswordModal from "@/components/custom/auth/reset-password-modal";
import AuthStatusModal from "@/components/custom/auth/auth-status-modal";
import ContactModal from "@/components/custom/contact/contact-modal";
import {
  AUTH_MODAL_NAMES,
  PUBLIC_MODAL_NAMES,
} from "@/lib/modal/modal-registry";
import { useModalUrl } from "@/lib/modal/use-modal-url";
import { useUser } from "@/context/user-context";

const AUTH_MODE_BY_NAME: Record<string, AuthMode> = {
  login: "login",
  signup: "signup",
  "forgot-password": "forgot",
};

const MODE_TO_TARGET_NAME = {
  login: "login",
  signup: "signup",
  forgot: "forgot-password",
} as const;

// Shown in the login modal when a logged-out user tries to open a gated modal.
const GATE_MESSAGES: Record<string, string> = {
  "add-to-list": "Prijavi se za dodavanje proizvoda na popis za kupnju.",
  watchlist: "Prijavi se za praćenje sniženja ovog proizvoda.",
  "shopping-list": "Prijavi se za upravljanje popisima za kupnju.",
  "digital-card": "Prijavi se za upravljanje digitalnim karticama.",
  settings: "Prijavi se za otvaranje postavki.",
  onboarding: "Prijavi se za početak.",
};

/**
 * The single global mount point for URL-driven modals (?modal=...). Rendered
 * once in the root layout under Suspense; every modal it owns exists exactly
 * once app-wide.
 */
export default function ModalRouter() {
  const { target, closeModal, swapModal } = useModalUrl();
  const { isAuthenticated, isLoading } = useUser();

  const isAuthTarget =
    !!target && (AUTH_MODAL_NAMES as readonly string[]).includes(target.name);
  const isPublicTarget =
    !!target && (PUBLIC_MODAL_NAMES as readonly string[]).includes(target.name);

  // Protected modals opened while logged out show the login modal instead; the
  // modal param stays in the URL, so the intended modal appears after login.
  // Public modals (reset-password, email confirmations) are never gated.
  const needsAuthGate =
    !!target &&
    !isAuthTarget &&
    !isPublicTarget &&
    !isAuthenticated &&
    !isLoading;

  const showAuthModal =
    (isAuthTarget && !isAuthenticated && !isLoading) || needsAuthGate;

  // While gating, the URL still holds the intended target (add-to-list, ...), so the
  // login/signup switch is tracked locally instead of overwriting that target.
  const [gateMode, setGateMode] = useState<AuthMode>("login");

  const authMode: AuthMode = needsAuthGate
    ? gateMode
    : ((target && AUTH_MODE_BY_NAME[target.name]) ?? "login");

  const gateMessage = needsAuthGate ? GATE_MESSAGES[target.name] : undefined;

  function handleModeChange(mode: AuthMode) {
    if (needsAuthGate) setGateMode(mode);
    else swapModal({ name: MODE_TO_TARGET_NAME[mode] });
  }

  function handleAuthOpenChange(open: boolean) {
    if (open) return;
    setGateMode("login");
    closeModal();
  }

  return (
    <>
      <AuthModal
        open={showAuthModal}
        mode={authMode}
        message={gateMessage}
        onOpenChange={handleAuthOpenChange}
        onModeChange={handleModeChange}
      />

      <ResetPasswordModal open={target?.name === "reset-password"} />
      <AuthStatusModal
        open={target?.name === "email-verified"}
        kind="email-verified"
      />
      <AuthStatusModal
        open={target?.name === "email-changed"}
        kind="email-changed"
      />

      <ContactModal open={target?.name === "contact"} />

      {isAuthenticated && (
        <>
          <OnboardingGate />
          <SettingsModalHost />
          <EntityModalOutlet target={isEntityTarget(target) ? target : null} />
        </>
      )}
    </>
  );
}
