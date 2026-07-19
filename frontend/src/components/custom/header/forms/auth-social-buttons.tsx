"use client";

import { CircleCheck } from "lucide-react";
import { toast } from "sonner";

import { signIn } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import GoogleIcon from "@/components/icons/google-icon";
import FacebookIcon from "@/components/icons/facebook-icon";
import { FACEBOOK_COMING_SOON } from "@/constants/auth";
import { setLastLoginMethod } from "@/utils/browser/local-storage";
import { stripModalSearch } from "@/lib/modal/modal-registry";

// After the OAuth round-trip, return to the page the user started on (minus the
// auth modal param) instead of always bouncing to the homepage.
function currentReturnUrl(): string {
  if (typeof window === "undefined") return "/";
  const search = stripModalSearch(new URLSearchParams(window.location.search));
  return window.location.pathname + search;
}

type SocialProvider = "google" | "facebook";

interface IAuthSocialButtonsProps {
  lastLoginMethod: string | null;
  socialPending: SocialProvider | null;
  onPendingChange: (provider: SocialProvider | null) => void;
}

function LastLoginBadge() {
  return (
    <span className="absolute -top-2 right-3 inline-flex items-center gap-0.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-medium text-white shadow-sm">
      <CircleCheck size={9} />
      Zadnja prijava
    </span>
  );
}

export default function AuthSocialButtons({
  lastLoginMethod,
  socialPending,
  onPendingChange,
}: IAuthSocialButtonsProps) {
  async function handleSocialSignIn(provider: SocialProvider) {
    if (socialPending) return;

    onPendingChange(provider);
    try {
      setLastLoginMethod(provider);
      const returnUrl = currentReturnUrl();
      await signIn.social({
        provider,
        callbackURL: returnUrl,
        errorCallbackURL: returnUrl,
      });
    } catch {
      const label = provider === "google" ? "Google" : "Facebook";
      toast.error(`Greška pri ${label} prijavi. Pokušaj ponovo.`);
      onPendingChange(null);
    }
  }

  return (
    <div className="space-y-4">
      <Button
        variant="outline"
        size="lg"
        className="relative w-full gap-2"
        onClick={() => handleSocialSignIn("google")}
        disabled={socialPending !== null}
        loading={socialPending === "google"}
        icon={GoogleIcon}
        iconPlacement="left"
      >
        <span className="sm:hidden">Google</span>
        <span className="hidden sm:inline">Nastavi sa Google računom</span>
        {lastLoginMethod === "google" && socialPending !== "google" && (
          <LastLoginBadge />
        )}
      </Button>

      <Button
        variant="outline"
        size="lg"
        className="relative w-full gap-2"
        onClick={() => handleSocialSignIn("facebook")}
        disabled={socialPending !== null || FACEBOOK_COMING_SOON}
        loading={socialPending === "facebook"}
        icon={FacebookIcon}
        iconPlacement="left"
      >
        <span className="sm:hidden">Facebook</span>
        <span className="hidden sm:inline">Nastavi sa Facebook računom</span>
        {FACEBOOK_COMING_SOON ? (
          <Badge className="absolute -top-2 right-3 text-[10px] shadow-sm">
            USKORO
          </Badge>
        ) : (
          lastLoginMethod === "facebook" &&
          socialPending !== "facebook" && <LastLoginBadge />
        )}
      </Button>
    </div>
  );
}
