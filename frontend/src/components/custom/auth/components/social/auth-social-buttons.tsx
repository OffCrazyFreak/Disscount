"use client";

import { toast } from "sonner";

import { signIn } from "@/lib/auth/client";
import GoogleIcon from "@/components/icons/google-icon";
import FacebookIcon from "@/components/icons/facebook-icon";
import { FACEBOOK_COMING_SOON } from "@/constants/auth";
import { setLastLoginMethod } from "@/utils/browser/local-storage";
import { stripModalSearch } from "@/lib/modal/modal-registry";
import AuthSocialButton, {
  type SocialProvider,
} from "@/components/custom/auth/components/social/auth-social-button";

// After the OAuth round-trip, return to the page the user started on (minus the
// auth modal param) instead of always bouncing to the homepage.
function currentReturnUrl(): string {
  if (typeof window === "undefined") return "/";
  const search = stripModalSearch(new URLSearchParams(window.location.search));
  return window.location.pathname + search;
}

interface IAuthSocialButtonsProps {
  lastLoginMethod: string | null;
  socialPending: SocialProvider | null;
  onPendingChange: (provider: SocialProvider | null) => void;
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
      <AuthSocialButton
        provider="google"
        shortLabel="Google"
        fullLabel="Nastavi sa Google računom"
        icon={GoogleIcon}
        lastLoginMethod={lastLoginMethod}
        socialPending={socialPending}
        onSignIn={handleSocialSignIn}
      />

      <AuthSocialButton
        provider="facebook"
        shortLabel="Facebook"
        fullLabel="Nastavi sa Facebook računom"
        icon={FacebookIcon}
        lastLoginMethod={lastLoginMethod}
        socialPending={socialPending}
        comingSoon={FACEBOOK_COMING_SOON}
        onSignIn={handleSocialSignIn}
      />
    </div>
  );
}
