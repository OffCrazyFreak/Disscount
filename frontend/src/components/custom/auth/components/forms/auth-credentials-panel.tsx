"use client";

import Link from "next/link";

import { Separator } from "@/components/ui/separator";
import LoginForm from "@/components/custom/auth/components/forms/login-form";
import SignUpForm from "@/components/custom/auth/components/forms/signup-form";
import AuthSocialButtons from "@/components/custom/auth/components/social/auth-social-buttons";
import type { SocialProvider } from "@/components/custom/auth/components/social/auth-social-button";

interface IAuthCredentialsPanelProps {
  isLogin: boolean;
  lastLoginMethod: string | null;
  socialPending: SocialProvider | null;
  onPendingChange: (provider: SocialProvider | null) => void;
  onSuccess: () => void;
  onForgotPassword: () => void;
}

export default function AuthCredentialsPanel({
  isLogin,
  lastLoginMethod,
  socialPending,
  onPendingChange,
  onSuccess,
  onForgotPassword,
}: IAuthCredentialsPanelProps) {
  return (
    <div className="grid gap-8">
      {isLogin ? (
        <LoginForm
          onSuccess={onSuccess}
          onForgotPassword={onForgotPassword}
          isLastUsed={lastLoginMethod === "email"}
          externalDisabled={socialPending !== null}
        />
      ) : (
        <SignUpForm externalDisabled={socialPending !== null} />
      )}

      <div className="relative">
        <Separator />

        <div className="absolute inset-0 flex items-center justify-center">
          <span className="bg-background px-4 text-muted-foreground">ili</span>
        </div>
      </div>

      <AuthSocialButtons
        lastLoginMethod={lastLoginMethod}
        socialPending={socialPending}
        onPendingChange={onPendingChange}
      />

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
  );
}
