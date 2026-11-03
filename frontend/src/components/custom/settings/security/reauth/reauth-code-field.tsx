"use client";

import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { REAUTH_CODE_LENGTH } from "@/constants/auth";
import type { CodeDelivery } from "@/components/custom/settings/security/reauth/reauth-requests";
import { useResendCountdown } from "@/components/custom/settings/security/reauth/use-resend-countdown";

interface IReauthCodeFieldProps {
  email: string;
  value: string;
  onChange: (value: string) => void;
  errorId?: string;
  delivery: CodeDelivery;
  resendAt: number;
  onResend: () => void;
}

function formatWait(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export default function ReauthCodeField({
  email,
  value,
  onChange,
  errorId,
  delivery,
  resendAt,
  onResend,
}: IReauthCodeFieldProps) {
  const t = useTranslations("settings");
  const secondsLeft = useResendCountdown(resendAt);
  const canResend = delivery !== "sending" && secondsLeft === 0;
  const sentTo = t.rich("security.reauth.codeSent", {
    email,
    strong: (chunks) => (
      <span className="font-medium text-foreground">{chunks}</span>
    ),
  });

  return (
    <div className="space-y-2">
      {/* Polite, so "sent" and a failed send are both announced without moving focus. */}
      <p aria-live="polite" className="text-sm text-muted-foreground">
        {delivery === "sending" && t("security.reauth.codeSending")}
        {delivery === "sent" && sentTo}
        {delivery === "failed" && t("security.reauth.codeSendFailed")}
        {delivery === "too-many" && t("security.reauth.codeEmailLimit")}
      </p>

      <Label htmlFor="reauth-code">{t("security.reauth.codeLabel")}</Label>
      <Input
        id="reauth-code"
        autoFocus
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        maxLength={REAUTH_CODE_LENGTH}
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, ""))}
        className="text-center font-mono text-2xl tracking-widest"
        aria-invalid={errorId ? true : undefined}
        aria-describedby={errorId}
      />

      <p className="flex items-center gap-1 text-sm text-muted-foreground">
        {t("security.reauth.codeMissing")}
        <button
          type="button"
          aria-disabled={!canResend}
          onClick={() => {
            if (canResend) onResend();
          }}
          className="cursor-pointer text-primary underline hover:text-primary/80 aria-disabled:cursor-not-allowed aria-disabled:no-underline aria-disabled:opacity-60"
        >
          {secondsLeft > 0
            ? t("security.reauth.resendIn", { wait: formatWait(secondsLeft) })
            : t("security.reauth.resend")}
        </button>
      </p>
    </div>
  );
}
