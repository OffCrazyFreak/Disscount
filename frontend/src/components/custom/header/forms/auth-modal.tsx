"use client";

import { useState, useEffect } from "react";
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
import { Separator } from "@/components/ui/separator";
import { LoginForm } from "@/components/custom/header/forms/login-form";
import { SignUpForm } from "@/components/custom/header/forms/signup-form";
import { ForgotPasswordForm } from "@/components/custom/header/forms/forgot-password-form";
import { GoogleIcon } from "@/components/icons/google-icon";
import { FacebookIcon } from "@/components/icons/facebook-icon";
import {
  getLastLoginMethod,
  setLastLoginMethod,
} from "@/utils/browser/local-storage";
import { LoginMethod } from "@/typings/local-storage";

interface IAuthModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

type AuthMode = "login" | "signup" | "forgot";

export function AuthModal({ isOpen, onOpenChange }: IAuthModalProps) {
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [lastLoginMethod, setLastLoginMethodState] = useState<LoginMethod | null>(
    null,
  );
  const [socialPending, setSocialPending] = useState<
    "google" | "facebook" | null
  >(null);

  useEffect(() => {
    setLastLoginMethodState(getLastLoginMethod());
  }, [isOpen]);

  const handleLoginSuccess = () => {
    onOpenChange(false);
  };

  const handleForgotPassword = () => {
    setAuthMode("forgot");
  };

  async function handleSocialSignIn(provider: "google" | "facebook") {
    if (socialPending) return;

    setSocialPending(provider);
    try {
      setLastLoginMethod(provider);
      setLastLoginMethodState(provider);
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

  const switchToSignUp = () => {
    setAuthMode("signup");
  };

  const switchToLogin = () => {
    setAuthMode("login");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl mb-2">
            {authMode === "login"
              ? "Prijava"
              : authMode === "signup"
                ? "Registracija"
                : "Zaboravljena lozinka"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-8">
          {authMode === "login" && (
            <LoginForm
              onSuccess={handleLoginSuccess}
              onForgotPassword={handleForgotPassword}
              isLastUsed={lastLoginMethod === "email"}
              externalDisabled={socialPending !== null}
            />
          )}

          {authMode === "signup" && (
            <SignUpForm externalDisabled={socialPending !== null} />
          )}

          {authMode === "forgot" && (
            <ForgotPasswordForm onBackToLogin={switchToLogin} />
          )}

          {authMode !== "forgot" && (
            <>
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
            disabled={socialPending !== null}
            loading={socialPending === "facebook"}
            icon={FacebookIcon}
            iconPlacement="left"
          >
            Nastavi sa Facebook računom
            {lastLoginMethod === "facebook" && socialPending !== "facebook" && (
              <span className="absolute right-3 inline-flex items-center gap-0.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-medium text-white">
                <CircleCheck size={9} />
                Zadnja prijava
              </span>
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
            </>
          )}
        </div>

        <DialogFooter className="text-xs text-gray-500 text-center my-2 block">
          {authMode === "login" && (
            <>
              Još nemaš račun?{" "}
              <button
                type="button"
                onClick={switchToSignUp}
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
                onClick={switchToLogin}
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
