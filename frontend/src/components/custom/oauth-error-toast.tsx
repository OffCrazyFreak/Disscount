"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

// Maps Better Auth OAuth error codes (appended as ?error= on a failed sign-in or
// account-linking redirect) to localized, user-friendly messages.
const ERROR_MESSAGES: Record<string, string> = {
  email_not_found:
    "Tvoj Facebook račun nije podijelio email adresu. Prijavi se emailom ili Facebook računom koji ima email.",
  "email_doesn't_match":
    "Taj račun koristi drugu email adresu. Možeš povezati samo račune s istom email adresom.",
};

const DEFAULT_MESSAGE = "Došlo je do greške. Pokušaj ponovo.";

// Surfaces failed OAuth flows (social sign-in or account linking) as a toast.
// Reads ?error= via useSearchParams (Next's router snapshot) instead of window.location:
// the redirect's URL gets rewritten during session load, which previously lost the toast.
// The router snapshot is unaffected by that raw rewrite, so the message reliably shows.
export default function OAuthErrorToast() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const shown = useRef(false);

  useEffect(() => {
    if (!error || shown.current) return;

    shown.current = true;
    toast.error(ERROR_MESSAGES[error] ?? DEFAULT_MESSAGE, { duration: 6000 });

    // Strip the param from the address bar so a refresh doesn't re-show it.
    const params = new URLSearchParams(window.location.search);
    if (params.has("error")) {
      params.delete("error");
      params.delete("error_description");
      const query = params.toString();
      window.history.replaceState(
        {},
        "",
        window.location.pathname + (query ? `?${query}` : ""),
      );
    }
  }, [error]);

  return null;
}
