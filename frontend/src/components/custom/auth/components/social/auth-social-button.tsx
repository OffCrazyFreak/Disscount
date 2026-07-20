"use client";

import type { ElementType } from "react";
import { CircleCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

function LastLoginBadge() {
  return (
    <span className="absolute -top-2 right-3 inline-flex items-center gap-0.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-medium text-white shadow-sm">
      <CircleCheck size={9} />
      Zadnja prijava
    </span>
  );
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
        <Badge className="absolute -top-2 right-3 text-[10px] shadow-sm">
          USKORO
        </Badge>
      ) : (
        lastLoginMethod === provider &&
        socialPending !== provider && <LastLoginBadge />
      )}
    </Button>
  );
}
