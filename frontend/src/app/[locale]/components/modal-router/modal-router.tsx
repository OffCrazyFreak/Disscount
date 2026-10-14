"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import AuthModal, { AuthMode } from "@/components/custom/auth/auth-modal";
import EntityModalOutlet, {
  isEntityTarget,
} from "@/app/[locale]/components/modal-router/entity-modal-outlet";
import SettingsModalHost from "@/components/custom/settings/settings-modal-host";
import OnboardingGate from "@/components/custom/settings/onboarding/components/onboarding-gate";
import ResetPasswordModal from "@/components/custom/auth/reset-password-modal";
import AuthStatusModal from "@/components/custom/auth/auth-status-modal";
import ContactModal from "@/components/custom/contact/contact-modal";
import DonationModal from "@/components/custom/donation/donation-modal";
import ProductActionsOutlet from "@/app/[locale]/components/modal-router/product-actions-outlet";
import ShoppingListActionsOutlet from "@/app/[locale]/components/modal-router/shopping-list-actions-outlet";
import { AUTH_MODAL_NAMES, isPublicModal } from "@/lib/modal/modal-registry";
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
type GateKey =
  `modalRouter.gate.${"addToList" | "watchlist" | "manageLists" | "manageCards" | "settings" | "onboarding"}`;

const GATE_MESSAGES: Record<string, GateKey> = {
  "add-to-list": "modalRouter.gate.addToList",
  watchlist: "modalRouter.gate.watchlist",
  "shopping-list": "modalRouter.gate.manageLists",
  "shopping-list-actions": "modalRouter.gate.manageLists",
  "digital-card": "modalRouter.gate.manageCards",
  settings: "modalRouter.gate.settings",
  onboarding: "modalRouter.gate.onboarding",
};

/**
 * The single global mount point for URL-driven modals (?modal=...). Rendered
 * once in the root layout under Suspense; every modal it owns exists exactly
 * once app-wide.
 */
export default function ModalRouter() {
  const t = useTranslations("shell");
  const { target, closeModal, swapModal } = useModalUrl();
  const { isAuthenticated, isLoading } = useUser();

  const isAuthTarget =
    !!target && (AUTH_MODAL_NAMES as readonly string[]).includes(target.name);
  const isPublicTarget = !!target && isPublicModal(target.name);

  // The modal param stays in the URL, so the intended modal opens after login.
  const needsAuthGate =
    !!target &&
    !isAuthTarget &&
    !isPublicTarget &&
    !isAuthenticated &&
    !isLoading;

  const showAuthModal =
    (isAuthTarget && !isAuthenticated && !isLoading) || needsAuthGate;

  // Tracked locally, since the URL still holds the gated target.
  const [gateMode, setGateMode] = useState<AuthMode>("login");

  const authMode: AuthMode = needsAuthGate
    ? gateMode
    : ((target && AUTH_MODE_BY_NAME[target.name]) ?? "login");

  const gateKey = needsAuthGate ? GATE_MESSAGES[target.name] : undefined;
  const gateMessage = gateKey ? t(gateKey) : undefined;

  function handleModeChange(mode: AuthMode) {
    if (needsAuthGate) setGateMode(mode);
    else swapModal({ name: MODE_TO_TARGET_NAME[mode] });
  }

  function handleAuthOpenChange(open: boolean) {
    if (open) return;
    setGateMode("login");
    closeModal();
  }

  function handleAuthSuccess() {
    setGateMode("login");
    if (!needsAuthGate) closeModal();
  }

  return (
    <>
      <AuthModal
        open={showAuthModal}
        mode={authMode}
        message={gateMessage}
        onOpenChange={handleAuthOpenChange}
        onModeChange={handleModeChange}
        onSuccess={handleAuthSuccess}
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
      <DonationModal open={target?.name === "donate"} />

      <ProductActionsOutlet target={target} />

      {isAuthenticated && (
        <>
          <OnboardingGate />
          <SettingsModalHost />
          <EntityModalOutlet target={isEntityTarget(target) ? target : null} />
          <ShoppingListActionsOutlet target={target} />
        </>
      )}
    </>
  );
}
