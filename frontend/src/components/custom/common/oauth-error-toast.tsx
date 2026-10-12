"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

// Better Auth appends ?error=<code>; map each one so the user learns why.
const ERROR_MESSAGE_KEYS = {
  email_not_found: "oauthError.emailNotFound",
  // Linking flow: the provider's email differs from the logged-in account's email.
  "email_doesn't_match": "oauthError.emailMismatch",
  // Linking flow: that exact provider account already belongs to another Disscount user.
  account_already_linked_to_different_user: "oauthError.alreadyLinked",
  // Sign-in flow: a matching account exists but can't be auto-linked under current rules.
  account_not_linked: "oauthError.notLinked",
  please_restart_the_process: "oauthError.restart",
} as const;

function isKnownError(code: string): code is keyof typeof ERROR_MESSAGE_KEYS {
  return Object.hasOwn(ERROR_MESSAGE_KEYS, code);
}

// Mounted app-wide, since linking errors happen while the auth modal is unmounted.
// Reads ?error= via useSearchParams, not window.location, which loses a race with
// the URL rewrite during session load.
export default function OAuthErrorToast() {
  const t = useTranslations("common");
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const shown = useRef(false);

  useEffect(() => {
    if (!error || shown.current) return;

    shown.current = true;
    toast.error(
      isKnownError(error)
        ? t(ERROR_MESSAGE_KEYS[error])
        : t("oauthError.default"),
      { duration: 6000 },
    );

    // Strip the param from the address bar so a refresh doesn't re-show the toast.
    const params = new URLSearchParams(window.location.search);
    params.delete("error");
    params.delete("error_description");
    const query = params.toString();
    window.history.replaceState(
      {},
      "",
      window.location.pathname + (query ? `?${query}` : ""),
    );
  }, [error, t]);

  return null;
}
