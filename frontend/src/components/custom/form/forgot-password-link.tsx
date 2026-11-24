"use client";

import { useTranslations } from "next-intl";

interface IForgotPasswordLinkProps {
  onClick: () => void;
  // Only the settings tab sends an email inline; the login modal just switches mode.
  sending?: boolean;
}

export default function ForgotPasswordLink({
  onClick,
  sending = false,
}: IForgotPasswordLinkProps) {
  const t = useTranslations("common");

  return (
    <button
      type="button"
      // aria-disabled because a disabled element cannot hold focus, dropping it to the body.
      aria-disabled={sending}
      onClick={() => {
        if (sending) return;

        onClick();
      }}
      className="cursor-pointer text-sm text-primary underline hover:text-primary/80 aria-disabled:cursor-not-allowed aria-disabled:opacity-60"
    >
      {sending ? t("forgotPassword.sending") : t("forgotPassword.link")}
    </button>
  );
}
