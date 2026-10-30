"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import type { AuthMode } from "@/components/custom/auth/auth-modal";
import { AUTH_MODAL_NAMES, isPublicModal } from "@/lib/modal/modal-registry";
import type { ModalTarget } from "@/lib/modal/modal-registry";
import { closeModalUrl, swapModalUrl } from "@/lib/modal/modal-navigation";

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

function isAuthModalName(name: string): boolean {
  return (AUTH_MODAL_NAMES as readonly string[]).includes(name);
}

/** Decides whether the auth modal shows, in which mode, and with which gate message. */
export default function useAuthGate(
  target: ModalTarget | null,
  isAuthenticated: boolean,
  isLoading: boolean,
) {
  const t = useTranslations("shell");

  const isSignedOut = !isAuthenticated && !isLoading;
  const isAuthTarget = !!target && isAuthModalName(target.name);
  const isPublicTarget = !!target && isPublicModal(target.name);

  // The modal param stays in the URL, so the intended modal opens after login.
  const needsAuthGate =
    !!target && !isAuthTarget && !isPublicTarget && isSignedOut;

  const showAuthModal = (isAuthTarget && isSignedOut) || needsAuthGate;

  // Tracked locally, since the URL still holds the gated target.
  const [gateMode, setGateMode] = useState<AuthMode>("login");

  const authMode: AuthMode = needsAuthGate
    ? gateMode
    : ((target && AUTH_MODE_BY_NAME[target.name]) ?? "login");

  const gateKey = needsAuthGate ? GATE_MESSAGES[target.name] : undefined;
  const gateMessage = gateKey ? t(gateKey) : undefined;

  function handleModeChange(mode: AuthMode) {
    if (needsAuthGate) setGateMode(mode);
    else swapModalUrl({ name: MODE_TO_TARGET_NAME[mode] });
  }

  function handleAuthOpenChange(open: boolean) {
    if (open) return;
    setGateMode("login");
    closeModalUrl();
  }

  function handleAuthSuccess() {
    setGateMode("login");
    if (!needsAuthGate) closeModalUrl();
  }

  return {
    showAuthModal,
    authMode,
    gateMessage,
    handleModeChange,
    handleAuthOpenChange,
    handleAuthSuccess,
  };
}
