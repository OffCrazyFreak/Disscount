"use client";

import Link from "next/link";
import { CircleCheck } from "lucide-react";
import { toast } from "sonner";

import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { GoogleIcon } from "@/components/icons/google-icon";
import { FacebookIcon } from "@/components/icons/facebook-icon";
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

interface AuthSocialButtonsProps {
  lastLoginMethod: string | null;
  socialPending: SocialProvider | null;
  onPendingChange: (provider: SocialProvider | null) => void;
}

function LastLoginBadge() {
  return (
    <span className="absolute right-3 inline-flex items-center gap-0.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-medium text-white">
      <CircleCheck size={9} />
      Zadnja prijava
    </span>
  );
}

export function AuthSocialButtons({
  lastLoginMethod,
  socialPending,
  onPendingChange,
}: AuthSocialButtonsProps) {
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
    <>
      <div className="relative">
        <Separator />

        <div className="absolute inset-0 flex items-center justify-center">
          <span className="bg-background px-4 text-muted-foreground">ili</span>
        </div>
      </div>

      <Button
        variant="outline"
        size="lg"
        className="w-full gap-4"
        onClick={() => handleSocialSignIn("google")}
        disabled={socialPending !== null}
        loading={socialPending === "google"}
        icon={GoogleIcon}
        iconPlacement="left"
      >
        Nastavi sa Google računom
        {lastLoginMethod === "google" && socialPending !== "google" && (
          <LastLoginBadge />
        )}
      </Button>

      <Button
        variant="outline"
        size="lg"
        className="w-full gap-4"
        onClick={() => handleSocialSignIn("facebook")}
        disabled={socialPending !== null || FACEBOOK_COMING_SOON}
        loading={socialPending === "facebook"}
        icon={FacebookIcon}
        iconPlacement="left"
      >
        Nastavi sa Facebook računom
        {FACEBOOK_COMING_SOON ? (
          <Badge className="absolute right-3 text-[10px]">USKORO</Badge>
        ) : (
          lastLoginMethod === "facebook" &&
          socialPending !== "facebook" && <LastLoginBadge />
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
  );
}
