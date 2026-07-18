"use client";

import { useState, useSyncExternalStore } from "react";

import { ModalShell } from "@/components/ui/modal-shell";
import { LoginForm } from "@/components/custom/header/forms/login-form";
import { SignUpForm } from "@/components/custom/header/forms/signup-form";
import { ForgotPasswordForm } from "@/components/custom/header/forms/forgot-password-form";
import { AuthSocialButtons } from "@/components/custom/header/forms/auth-social-buttons";
import { AuthModeSwitch } from "@/components/custom/header/forms/auth-mode-switch";
import { getLastLoginMethod } from "@/utils/browser/local-storage";

export type AuthMode = "login" | "signup" | "forgot";

const TITLES: Record<AuthMode, string> = {
  login: "Prijava",
  signup: "Registracija",
  forgot: "Zaboravljena lozinka",
};

const DESCRIPTIONS: Record<AuthMode, string> = {
  login: "Prijavi se u svoj Disscount račun.",
  signup: "Stvori novi Disscount račun.",
  forgot: "Poslat ćemo ti poveznicu za ponovno postavljanje lozinke.",
};

interface AuthModalProps {
  open: boolean;
  mode: AuthMode;
  onOpenChange: (open: boolean) => void;
  onModeChange: (mode: AuthMode) => void;
}

// Re-read the badge when localStorage changes in another tab; same-tab writes happen right
// before a redirect, so a no-op there is fine.
function subscribeToStorage(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export function AuthModal({
  open,
  mode,
  onOpenChange,
  onModeChange,
}: AuthModalProps) {
  const [socialPending, setSocialPending] = useState<
    "google" | "facebook" | null
  >(null);

  // The last-used method lives in localStorage (an external store); reading it via
  // useSyncExternalStore keeps the badge SSR-safe without a state-setting effect.
  const lastLoginMethod = useSyncExternalStore(
    subscribeToStorage,
    () => getLastLoginMethod(),
    () => null
  );

  // OAuth failures are surfaced by the app-wide <OAuthErrorToast />, not here - account-linking
  // errors happen while logged in, when this modal isn't mounted.

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      title={TITLES[mode]}
      description={DESCRIPTIONS[mode]}
      srOnlyDescription
      caption={<AuthModeSwitch mode={mode} onModeChange={onModeChange} />}
    >
      {mode === "forgot" ? (
        <ForgotPasswordForm onBackToLogin={() => onModeChange("login")} />
      ) : (
        <div className="grid gap-8">
          {mode === "login" ? (
            <LoginForm
              onSuccess={() => onOpenChange(false)}
              onForgotPassword={() => onModeChange("forgot")}
              isLastUsed={lastLoginMethod === "email"}
              externalDisabled={socialPending !== null}
            />
          ) : (
            <SignUpForm externalDisabled={socialPending !== null} />
          )}

          <AuthSocialButtons
            lastLoginMethod={lastLoginMethod}
            socialPending={socialPending}
            onPendingChange={setSocialPending}
          />
        </div>
      )}
    </ModalShell>
  );
}
