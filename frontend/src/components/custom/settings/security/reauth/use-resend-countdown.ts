"use client";

import { useEffect, useState } from "react";

import { REAUTH_CODE_RESEND_SECONDS } from "@/constants/auth";

/** Whole seconds until another code may be sent; ticks while the dialog is mounted. */
export function useResendCountdown(resendAt: number) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Clamped, because `now` can trail a just-reset resendAt by up to one tick.
  return Math.min(
    REAUTH_CODE_RESEND_SECONDS,
    Math.max(0, Math.ceil((resendAt - now) / 1000)),
  );
}
