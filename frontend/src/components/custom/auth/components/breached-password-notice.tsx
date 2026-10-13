"use client";

import { useEffect, useId, useRef } from "react";
import { ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { RESET_TOKEN_TTL_SECONDS } from "@/constants/auth";
import { useBreachedPasswordResend } from "@/components/custom/auth/hooks/use-breached-password-resend";

interface IBreachedPasswordNoticeProps {
  email: string;
  onBackToLogin: () => void;
}

// Replaces the login form, so focus moves to the heading or it would fall to the body.
export default function BreachedPasswordNotice({
  email,
  onBackToLogin,
}: IBreachedPasswordNoticeProps) {
  const t = useTranslations("auth");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const explanationId = useId();
  const { resend, sending, coolingDown, resent } =
    useBreachedPasswordResend(email);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const resendBlocked = sending || coolingDown;

  return (
    <div className="flex flex-col items-center gap-3 py-4 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <ShieldAlert aria-hidden="true" className="size-6" />
      </div>

      {/* The heading takes focus, and describedby makes it read the explanation too. */}
      <h3
        ref={headingRef}
        tabIndex={-1}
        aria-describedby={explanationId}
        className="text-lg font-semibold"
      >
        {t("breached.title")}
      </h3>

      <div id={explanationId} className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          {t("breached.explanation")}
        </p>

        <p className="text-sm font-medium">{email}</p>

        <p className="text-sm text-muted-foreground">
          {t("breached.afterReset", { minutes: RESET_TOKEN_TTL_SECONDS / 60 })}
        </p>
      </div>

      {/* Always mounted, so each change of text, including the cooldown ending, is announced. */}
      <p role="status" className="text-sm font-medium">
        {resent &&
          (coolingDown ? t("breached.resent") : t("breached.canResend"))}
      </p>

      <Button
        type="button"
        variant="outline"
        className="w-full aria-disabled:cursor-not-allowed aria-disabled:opacity-60"
        // Not the native attribute or Button's loading state: both disable the element,
        // which drops focus to the body right after the user pressed it.
        aria-disabled={resendBlocked}
        onClick={resend}
      >
        {sending ? t("forgot.sending") : t("breached.resend")}
      </Button>

      <button
        type="button"
        onClick={onBackToLogin}
        className="cursor-pointer text-sm text-primary underline hover:text-primary/80"
      >
        {t("forgot.backToLogin")}
      </button>
    </div>
  );
}
