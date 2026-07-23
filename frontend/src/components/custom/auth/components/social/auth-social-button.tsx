"use client";

import type { ElementType } from "react";

import { Button } from "@/components/ui/button";
import ComingSoonBadge from "@/components/custom/common/coming-soon-badge";
import LastLoginBadge from "@/components/custom/auth/components/last-login-badge";

export type SocialProvider = "google" | "facebook";

interface IAuthSocialButtonProps {
  provider: SocialProvider;
  shortLabel: string;
  fullLabel: string;
  icon: ElementType;
  lastLoginMethod: string | null;
  socialPending: SocialProvider | null;
  comingSoon?: boolean;
  onSignIn: (provider: SocialProvider) => void;
}

export default function AuthSocialButton({
  provider,
  shortLabel,
  fullLabel,
  icon,
  lastLoginMethod,
  socialPending,
  comingSoon = false,
  onSignIn,
}: IAuthSocialButtonProps) {
  return (
    <Button
      variant="outline"
      size="lg"
      className="relative w-full gap-2"
      onClick={() => onSignIn(provider)}
      disabled={socialPending !== null || comingSoon}
      loading={socialPending === provider}
      icon={icon}
      iconPlacement="left"
    >
      <span className="sm:hidden">{shortLabel}</span>
      <span className="hidden sm:inline">{fullLabel}</span>
      {comingSoon ? (
        <ComingSoonBadge className="absolute -top-2.5 sm:-top-3.5 right-1 sm:right-4" />
      ) : (
        lastLoginMethod === provider &&
        socialPending !== provider && <LastLoginBadge />
      )}
    </Button>
  );
}
