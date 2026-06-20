"use client";

import { useState, useEffect } from "react";
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
import { GoogleIcon } from "@/components/icons/google-icon";
import { FacebookIcon } from "@/components/icons/facebook-icon";
import {
  getLastLoginMethod,
  setLastLoginMethod,
} from "@/utils/browser/local-storage";

interface IAuthModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

type AuthMode = "login" | "signup";

export function AuthModal({ isOpen, onOpenChange }: IAuthModalProps) {
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [lastLoginMethod, setLastLoginMethodState] = useState<
    "email" | "google" | null
  >(null);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);

  useEffect(() => {
    setLastLoginMethodState(getLastLoginMethod());
  }, [isOpen]);

  const handleLoginSuccess = () => {
    onOpenChange(false);
  };

  const handleSignUpSuccess = () => {
    onOpenChange(false);
    setShowOnboarding(true);
  };

  const handleGoogleSignIn = async () => {
    if (isGoogleSigningIn) return;

    setIsGoogleSigningIn(true);
    try {
      setLastLoginMethod("google");
      setLastLoginMethodState("google");
      await signIn.social({ provider: "google", callbackURL: "/" });
    } catch {
      toast.error("Greška pri Google prijavi. Pokušaj ponovo.");
    } finally {
      setIsGoogleSigningIn(false);
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
              externalDisabled={isGoogleSigningIn}
            />
          ) : (
            <SignUpForm
              onSuccess={handleSignUpSuccess}
              externalDisabled={isGoogleSigningIn}
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
            onClick={handleGoogleSignIn}
            disabled={isGoogleSigningIn}
            loading={isGoogleSigningIn}
            icon={GoogleIcon}
            iconPlacement="left"
          >
            Nastavi sa Google računom
            {lastLoginMethod === "google" && !isGoogleSigningIn && (
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
            disabled
            icon={FacebookIcon}
            iconPlacement="left"
          >
            Nastavi sa Facebook računom
            <Badge className="absolute right-3 text-[10px]">USKORO</Badge>
          </Button>
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
