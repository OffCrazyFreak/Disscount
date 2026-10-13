"use client";

import { useEffect, useId, useRef } from "react";
import { ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
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
        Ova lozinka pronađena je u curenju podataka
      </h3>

      <div id={explanationId} className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          Lozinka je ispravna, ali pojavila se u poznatom curenju podataka s
          neke druge stranice. Zato te nismo prijavili. Poveznicu za
          postavljanje nove lozinke poslali smo na:
        </p>

        <p className="text-sm font-medium">{email}</p>

        <p className="text-sm text-muted-foreground">
          Kad postaviš novu lozinku, odjavit ćemo te sa svih uređaja. Poveznica
          vrijedi 30 minuta od slanja. Ako ne stigne, provjeri spam / neželjenu
          poštu ili zatraži novu.
        </p>
      </div>

      {/* Always mounted, so each change of text, including the cooldown ending, is announced. */}
      <p role="status" className="text-sm font-medium">
        {resent &&
          (coolingDown
            ? "Poslali smo novu poveznicu. Sljedeću možeš zatražiti za minutu."
            : "Možeš ponovno zatražiti poveznicu.")}
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
        {sending ? "Slanje..." : "Pošalji poveznicu ponovno"}
      </Button>

      <button
        type="button"
        onClick={onBackToLogin}
        className="cursor-pointer text-sm text-primary underline hover:text-primary/80"
      >
        Natrag na prijavu
      </button>
    </div>
  );
}
