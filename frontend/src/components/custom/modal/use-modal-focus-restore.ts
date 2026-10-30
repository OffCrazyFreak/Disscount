"use client";

import { useRef } from "react";

interface IFocusEvent {
  preventDefault: () => void;
  currentTarget: EventTarget | null;
}

export function useModalFocusRestore() {
  // Whatever had focus when the dialog opened, so closing can hand it back.
  const openerRef = useRef<HTMLElement | null>(null);

  // Focus the container, not the first control, which would pop its tooltip.
  // Inputs with autoFocus still focus themselves via the DOM.
  function onOpenAutoFocus(e: IFocusEvent) {
    // Fires while Radix is about to move focus in, so this is still the opener.
    openerRef.current = document.activeElement as HTMLElement | null;

    e.preventDefault();
    (e.currentTarget as HTMLElement | null)?.focus();
  }

  // Radix's own restore targets a trigger these modals do not have, and its body
  // fallback jumps the scroll. So restore to whatever was focused when the modal
  // opened, when that element is still around: for a modal opened from a button
  // that is still on the page, dropping focus to body makes a keyboard user
  // restart from the top. Falls back to the old no-op when it has gone, which is
  // the URL-driven case the previous comment described.
  function onCloseAutoFocus(e: IFocusEvent) {
    e.preventDefault();

    const opener = openerRef.current;
    // preventScroll, as Radix's own restore does: the scroll lock has just been
    // released, so a bare focus() scrolls the opener into view and jumps the page.
    if (opener?.isConnected) opener.focus({ preventScroll: true });
  }

  return { onOpenAutoFocus, onCloseAutoFocus };
}
