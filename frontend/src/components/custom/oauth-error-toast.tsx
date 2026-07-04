"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

// Better Auth appends ?error=<code> to the redirect when a social sign-in or account-linking
// flow fails. Map every code we can hit to a message key so the user always learns WHY
// (rather than a generic "something went wrong"). The messages live in auth.oauthErrors.
const CODE_TO_KEY: Record<string, string> = {
  email_not_found: "emailNotFound",
  // Linking flow: the provider's email differs from the logged-in account's email.
  "email_doesn't_match": "emailMismatch",
  // Linking flow: that exact provider account already belongs to another Disscount user.
  account_already_linked_to_different_user: "accountAlreadyLinked",
  // Sign-in flow: a matching account exists but can't be auto-linked under current rules.
  account_not_linked: "accountNotLinked",
  please_restart_the_process: "restart",
};

// Surfaces failed OAuth flows (social sign-in OR account linking) as a toast, mounted app-wide.
// Account-linking errors happen while logged in, so this must live outside the auth modal that
// only logged-out users render. Reads ?error= from Next's router snapshot (useSearchParams)
// rather than window.location, which loses a race against a URL rewrite during session load.
export default function OAuthErrorToast() {
  const t = useTranslations("auth.oauthErrors");
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const shown = useRef(false);

  useEffect(() => {
    if (!error || shown.current) return;

    shown.current = true;
    const key = (CODE_TO_KEY[error] ?? "default") as Parameters<typeof t>[0];
    toast.error(t(key), { duration: 6000 });

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
