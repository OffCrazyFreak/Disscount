"use client";

import { useState } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LoginForm } from "@/components/forms/login-form";
import { SignUpForm } from "@/components/forms/signup-form";
import { GoogleIcon } from "@daveyplate/better-auth-ui";

interface AuthModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

type AuthMode = "login" | "signup";

export function AuthModal({ isOpen, onOpenChange }: AuthModalProps) {
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [showOnboarding, setShowOnboarding] = useState(false);

  const handleLoginSuccess = () => {
    onOpenChange(false);
  };

  const handleSignUpSuccess = () => {
    onOpenChange(false);
    setShowOnboarding(true);
  };

  const handleGoogleSignIn = () => {
    // TODO: Implement Google OAuth flow
    toast.info("Google prijava će biti dodana uskoro");
  };

  const switchToSignUp = () => {
    setAuthMode("signup");
  };

  const switchToLogin = () => {
    setAuthMode("login");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {authMode === "login" ? "Prijava" : "Registracija"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-8 py-4">
          {authMode === "login" ? (
            <LoginForm onSuccess={handleLoginSuccess} />
          ) : (
            <SignUpForm onSuccess={handleSignUpSuccess} />
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
          >
            <GoogleIcon />
            Nastavi sa Google računom
          </Button>

          <div className="flex justify-center pt-4">
            <p className="text-center text-xs text-muted-foreground">
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
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
