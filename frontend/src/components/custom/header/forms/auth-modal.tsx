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

type AuthMode = "login" | "signup";

export function AuthModal({ isOpen, onOpenChange }: IAuthModalProps) {
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [lastLoginMethod, setLastLoginMethodState] = useState<LoginMethod | null>(
    null,
  );
  const [socialPending, setSocialPending] = useState<
    "google" | "facebook" | null
  >(null);

  useEffect(() => {
    setLastLoginMethodState(getLastLoginMethod());
  }, [isOpen]);

  // Surface OAuth failures: better-auth redirects to "/" with ?error=<code>.
  // The only social error we can produce is a Facebook login without email.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    if (!error) return;

    toast.error(
      error === "email_not_found"
        ? "Tvoj Facebook račun nije podijelio email adresu. Prijavi se emailom ili Facebook računom koji ima email."
        : "Greška pri prijavi. Pokušaj ponovo.",
    );

    params.delete("error");
    const query = params.toString();
    window.history.replaceState(
      {},
      "",
      window.location.pathname + (query ? `?${query}` : ""),
    );
  }, []);

  const handleLoginSuccess = () => {
    onOpenChange(false);
  };

  const handleSignUpSuccess = () => {
    onOpenChange(false);
    setShowOnboarding(true);
  };

  const handleSocialSignIn = async (provider: "google" | "facebook") => {
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
  };

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
            {authMode === "login" ? "Prijava" : "Registracija"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-8">
          {authMode === "login" ? (
            <LoginForm
              onSuccess={handleLoginSuccess}
              isLastUsed={lastLoginMethod === "email"}
              externalDisabled={socialPending !== null}
            />
          ) : (
            <SignUpForm
              onSuccess={handleSignUpSuccess}
              externalDisabled={socialPending !== null}
            />
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
        </div>

        <DialogFooter className="text-xs text-gray-500 text-center my-2 block">
          {authMode === "login" ? (
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
          ) : (
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
