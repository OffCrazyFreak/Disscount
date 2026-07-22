"use client";

import { useState } from "react";

import { CircleAlert } from "lucide-react";

import { ModalShell } from "@/components/custom/modal/modal-shell";
import { Banner } from "@/components/ui/banner";
import ForgotPasswordForm from "@/components/custom/auth/components/forms/forgot-password-form";
import AuthModeSwitch from "@/components/custom/auth/components/auth-mode-switch";
import AuthCredentialsPanel from "@/components/custom/auth/components/forms/auth-credentials-panel";
import { useLastLoginMethod } from "@/components/custom/auth/hooks/use-last-login-method";
import type { SocialProvider } from "@/components/custom/auth/components/social/auth-social-button";

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

interface IAuthModalProps {
  open: boolean;
  mode: AuthMode;
  // Contextual reason shown when the modal was opened by an auth gate, e.g.
  // "Prijavi se za dodavanje proizvoda na popis za kupnju."
  message?: string;
  onOpenChange: (open: boolean) => void;
  onModeChange: (mode: AuthMode) => void;
}

export default function AuthModal({
  open,
  mode,
  message,
  onOpenChange,
  onModeChange,
}: IAuthModalProps) {
  const [socialPending, setSocialPending] = useState<SocialProvider | null>(
    null,
  );

  const lastLoginMethod = useLastLoginMethod();

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
      {message && mode !== "forgot" && (
        <Banner variant="primarySoft" size="md" icon={CircleAlert}>
          {message}
        </Banner>
      )}

      {mode === "forgot" ? (
        <ForgotPasswordForm onBackToLogin={() => onModeChange("login")} />
      ) : (
        <AuthCredentialsPanel
          isLogin={mode === "login"}
          lastLoginMethod={lastLoginMethod}
          socialPending={socialPending}
          onPendingChange={setSocialPending}
          onSuccess={() => onOpenChange(false)}
          onForgotPassword={() => onModeChange("forgot")}
        />
      )}
    </ModalShell>
  );
}
