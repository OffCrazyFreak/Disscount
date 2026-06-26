"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

// Better Auth appends ?error=<code> to the redirect when a social sign-in or account-linking
// flow fails. Map every code we can hit to a localized, specific message so the user always
// learns WHY (rather than a generic "something went wrong").
const ERROR_MESSAGES: Record<string, string> = {
  email_not_found:
    "Tvoj Facebook račun nije podijelio email adresu. Prijavi se emailom ili Facebook računom koji ima email.",
  // Linking flow: the provider's email differs from the logged-in account's email.
  "email_doesn't_match":
    "Povezivanje nije uspjelo jer taj račun koristi drugu email adresu. Možeš povezati samo račune koji imaju istu email adresu kao tvoj.",
  // Linking flow: that exact provider account already belongs to another Disscount user.
  account_already_linked_to_different_user:
    "Taj račun je već povezan s drugim Disscount korisnikom. Ne možeš ga povezati s ovim računom.",
  // Sign-in flow: a matching account exists but can't be auto-linked under current rules.
  account_not_linked:
    "Ovu prijavu nije moguće automatski povezati s postojećim računom. Prijavi se postojećom metodom pa poveži račun u postavkama sigurnosti.",
  please_restart_the_process:
    "Postupak prijave je istekao ili je prekinut. Pokušaj ponovo.",
};

const DEFAULT_MESSAGE = "Došlo je do greške pri prijavi. Pokušaj ponovo.";

// Surfaces failed OAuth flows (social sign-in OR account linking) as a toast, mounted app-wide.
// Account-linking errors happen while logged in, so this must live outside the auth modal that
// only logged-out users render. Reads ?error= from Next's router snapshot (useSearchParams)
// rather than window.location, which loses a race against a URL rewrite during session load.
export default function OAuthErrorToast() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const shown = useRef(false);

  useEffect(() => {
    if (!error || shown.current) return;

    shown.current = true;
    toast.error(ERROR_MESSAGES[error] ?? DEFAULT_MESSAGE, { duration: 6000 });

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
  }, [error]);

  return null;
}
