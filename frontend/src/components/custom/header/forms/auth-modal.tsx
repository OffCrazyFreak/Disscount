"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { CircleCheck } from "lucide-react";
import { toast } from "sonner";
import { signIn } from "@/lib/auth-client";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LoginForm } from "@/components/custom/header/forms/login-form";
import { SignUpForm } from "@/components/custom/header/forms/signup-form";
import { ForgotPasswordForm } from "@/components/custom/header/forms/forgot-password-form";
import { GoogleIcon } from "@/components/icons/google-icon";
import { FacebookIcon } from "@/components/icons/facebook-icon";
import { FACEBOOK_COMING_SOON } from "@/constants/auth";
import {
  getLastLoginMethod,
  setLastLoginMethod,
} from "@/utils/browser/local-storage";

interface IAuthModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

type AuthMode = "login" | "signup" | "forgot";

const TITLES: Record<AuthMode, string> = {
  login: "Prijava",
  signup: "Registracija",
  forgot: "Zaboravljena lozinka",
};

// Re-read the badge when localStorage changes in another tab; same-tab writes happen right
// before a redirect, so a no-op there is fine.
function subscribeToStorage(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export function AuthModal({ isOpen, onOpenChange }: IAuthModalProps) {
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [socialPending, setSocialPending] = useState<
    "google" | "facebook" | null
  >(null);

  // The last-used method lives in localStorage (an external store); reading it via
  // useSyncExternalStore keeps the badge SSR-safe without a state-setting effect.
  const lastLoginMethod = useSyncExternalStore(
    subscribeToStorage,
    () => getLastLoginMethod(),
    () => null,
  );

  // OAuth failures are surfaced by the app-wide <OAuthErrorToast />, not here — account-linking
  // errors happen while logged in, when this modal isn't mounted.

  function handleOpenChange(open: boolean) {
    // Reset to the login tab on close so the next open doesn't show a stale signup/forgot tab.
    if (!open) setAuthMode("login");
    onOpenChange(open);
  }

  function handleLoginSuccess() {
    onOpenChange(false);
  }

  async function handleSocialSignIn(provider: "google" | "facebook") {
    if (socialPending) return;

    setSocialPending(provider);
    try {
      setLastLoginMethod(provider);
      await signIn.social({
        provider,
        callbackURL: "/",
        errorCallbackURL: "/",
      });
    } catch {
      const label = provider === "google" ? "Google" : "Facebook";
      toast.error(`Greška pri ${label} prijavi. Pokušaj ponovo.`);
      setSocialPending(null);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl mb-2">
            {TITLES[authMode]}
          </DialogTitle>
        </DialogHeader>

        {authMode === "forgot" ? (
          <ForgotPasswordForm onBackToLogin={() => setAuthMode("login")} />
        ) : (
          <div className="grid gap-8">
            {authMode === "login" ? (
              <LoginForm
                onSuccess={handleLoginSuccess}
                onForgotPassword={() => setAuthMode("forgot")}
                isLastUsed={lastLoginMethod === "email"}
                externalDisabled={socialPending !== null}
              />
            ) : (
              <SignUpForm externalDisabled={socialPending !== null} />
            )}

            <div className="relative">
              <Separator />

              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-background px-4 text-muted-foreground">
                  ili
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              size={"lg"}
              className="w-full gap-4"
              onClick={() => handleSocialSignIn("google")}
              disabled={socialPending !== null}
              loading={socialPending === "google"}
              icon={GoogleIcon}
              iconPlacement="left"
            >
              Nastavi sa Google računom
              {lastLoginMethod === "google" && socialPending !== "google" && (
                <span className="absolute right-3 inline-flex items-center gap-0.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-medium text-white">
                  <CircleCheck size={9} />
                  Zadnja prijava
                </span>
              )}
            </Button>

            <Button
              variant="outline"
              size={"lg"}
              className="w-full gap-4"
              onClick={() => handleSocialSignIn("facebook")}
              disabled={socialPending !== null || FACEBOOK_COMING_SOON}
              loading={socialPending === "facebook"}
              icon={FacebookIcon}
              iconPlacement="left"
            >
              Nastavi sa Facebook računom
              {FACEBOOK_COMING_SOON ? (
                <Badge className="absolute right-3 text-[10px]">USKORO</Badge>
              ) : (
                lastLoginMethod === "facebook" &&
                socialPending !== "facebook" && (
                  <span className="absolute right-3 inline-flex items-center gap-0.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-medium text-white">
                    <CircleCheck size={9} />
                    Zadnja prijava
                  </span>
                )
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground text-balance">
              Nastavkom prihvaćaš naše{" "}
              <Link
                href="/terms-of-service"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-primary"
              >
                Uvjete korištenja
              </Link>{" "}
              i{" "}
              <Link
                href="/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-primary"
              >
                Pravila privatnosti
              </Link>
              .
            </p>
          </div>
        )}

        <DialogFooter className="text-xs text-gray-500 text-center my-2 block">
          {authMode === "login" && (
            <>
              Još nemaš račun?{" "}
              <button
                type="button"
                onClick={() => setAuthMode("signup")}
                className="cursor-pointer underline text-primary hover:text-primary/80"
              >
                Registriraj se
              </button>
            </>
          )}
          {authMode === "signup" && (
            <>
              Već imaš račun?{" "}
              <button
                type="button"
                onClick={() => setAuthMode("login")}
                className="cursor-pointer underline text-primary hover:text-primary/80"
              >
                Prijavi se
              </button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
