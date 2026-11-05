"use client";

import { useRef } from "react";

interface IFocusEvent {
  preventDefault: () => void;
  currentTarget: EventTarget | null;
}

export function useModalFocusRestore() {
  // Whatever had focus when the dialog opened, so closing can hand it back.
  const openerRef = useRef<HTMLElement | null>(null);

  // The container, not the first control, which would pop its tooltip; inputs with autoFocus still focus themselves.
  function onOpenAutoFocus(e: IFocusEvent) {
    // Fires while Radix is about to move focus in, so this is still the opener.
    openerRef.current = document.activeElement as HTMLElement | null;

    e.preventDefault();
    (e.currentTarget as HTMLElement | null)?.focus();
  }

  // Radix's restore needs a trigger and its body fallback jumps the scroll, so use the opener if present.
  function onCloseAutoFocus(e: IFocusEvent) {
    e.preventDefault();

    const opener = openerRef.current;
    // preventScroll because the scroll lock just released, so a bare focus() jumps the page.
    if (opener?.isConnected) opener.focus({ preventScroll: true });
  }

  return { onOpenAutoFocus, onCloseAutoFocus };
}
