"use client";

import { useEffect, useRef } from "react";

import { usePathname } from "@/i18n/navigation";
import { dismissTouchKeyboard } from "@/utils/browser/touch-keyboard";

/** Global, so no form or link has to remember to close the on-screen keyboard. */
export default function TouchKeyboardDismissal() {
  const pathname = usePathname();
  const previousPathname = useRef(pathname);

  useEffect(() => {
    function handleSubmit(event: SubmitEvent) {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;

      // Waits a frame for validation to render, because a field that failed needs the keyboard.
      requestAnimationFrame(() => {
        if (form.querySelector('[aria-invalid="true"]')) return;
        dismissTouchKeyboard();
      });
    }

    document.addEventListener("submit", handleSubmit);
    return () => document.removeEventListener("submit", handleSubmit);
  }, []);

  useEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;

    // A modal the navigation opened has just focused its own first field.
    if (document.activeElement?.closest('[role="dialog"]')) return;

    dismissTouchKeyboard();
  }, [pathname]);

  return null;
}
