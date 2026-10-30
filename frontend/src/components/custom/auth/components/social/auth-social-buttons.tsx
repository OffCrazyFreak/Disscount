"use client";

import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { signIn } from "@/lib/auth/client";
import GoogleIcon from "@/components/icons/google-icon";
import FacebookIcon from "@/components/icons/facebook-icon";
import { FACEBOOK_COMING_SOON } from "@/constants/auth";
import { setLastLoginMethod } from "@/utils/browser/local-storage";
import { AUTH_MODAL_NAMES } from "@/lib/modal/modal-registry";
import { parseModalParam } from "@/lib/modal/modal-param-parser";
import { stripModalSearch } from "@/lib/modal/modal-search";
import AuthSocialButton, {
  type SocialProvider,
} from "@/components/custom/auth/components/social/auth-social-button";

// Brand names, never translated.
const PROVIDER_NAMES: Record<SocialProvider, string> = {
  google: "Google",
  facebook: "Facebook",
};

function oauthReturnUrl(): string {
  if (typeof window === "undefined") return "/";

  const params = new URLSearchParams(window.location.search);
  const target = parseModalParam(params);
  const isAuthModalTarget =
    !!target && (AUTH_MODAL_NAMES as readonly string[]).includes(target.name);

  const searchWithGatedTargetKept = isAuthModalTarget
    ? stripModalSearch(params)
    : window.location.search;

  return window.location.pathname + searchWithGatedTargetKept;
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
  const t = useTranslations("auth");

  async function handleSocialSignIn(provider: SocialProvider) {
    if (socialPending) return;

    onPendingChange(provider);
    try {
      setLastLoginMethod(provider);
      const returnUrl = oauthReturnUrl();
      const { error } = await signIn.social({
        provider,
        callbackURL: returnUrl,
        errorCallbackURL: returnUrl,
      });
      if (error) throw error;
    } catch {
      const label = PROVIDER_NAMES[provider];
      toast.error(t("social.error", { provider: label }));
      onPendingChange(null);
    }
  }

  return (
    <div className="space-y-4">
      <AuthSocialButton
        provider="google"
        shortLabel={PROVIDER_NAMES.google}
        fullLabel={t("social.continueWithGoogle")}
        icon={GoogleIcon}
        lastLoginMethod={lastLoginMethod}
        socialPending={socialPending}
        onSignIn={handleSocialSignIn}
      />

      <AuthSocialButton
        provider="facebook"
        shortLabel={PROVIDER_NAMES.facebook}
        fullLabel={t("social.continueWithFacebook")}
        icon={FacebookIcon}
        lastLoginMethod={lastLoginMethod}
        socialPending={socialPending}
        comingSoon={FACEBOOK_COMING_SOON}
        onSignIn={handleSocialSignIn}
      />
    </div>
  );
}
