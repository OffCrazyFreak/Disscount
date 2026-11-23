"use client";

import {
  FocusEvent,
  KeyboardEvent,
  PointerEvent,
  useEffect,
  useRef,
} from "react";

interface IUseSearchOpenerOptions {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

function isOnButton(target: EventTarget | null) {
  return target instanceof Element && target.closest("button") != null;
}

/** Opens the map search from its field and closes it with Escape or a back control. */
export function useSearchOpener({
  isOpen,
  onOpenChange,
}: IUseSearchOpenerOptions) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard close returns focus to the field; on touch that would raise the keyboard, so it blurs.
  const keepFocus = useRef(false);

  useEffect(() => {
    if (isOpen) return;

    if (keepFocus.current) inputRef.current?.focus({ preventScroll: true });
    else inputRef.current?.blur();
    keepFocus.current = false;
  }, [isOpen]);

  function close(byKeyboard: boolean) {
    keepFocus.current = byKeyboard;
    onOpenChange(false);
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key !== "Escape" || !isOpen) return;
    // A dropdown inside the panel, such as the chain filter, already closed itself on this Escape.
    if (event.defaultPrevented) return;

    // The store sheet listens for Escape too, and must stay open.
    event.stopPropagation();
    close(true);
  }

  const fieldProps = {
    onPointerDown(event: PointerEvent) {
      // The clear button empties the search without leaving the map.
      if (isOnButton(event.target)) return;
      onOpenChange(true);
    },

    onFocus(event: FocusEvent) {
      // Focus handed back on close, or on or from the clear button, stays put.
      if (keepFocus.current) return;
      if (event.currentTarget.contains(event.relatedTarget)) return;
      if (isOnButton(event.target)) return;
      onOpenChange(true);
    },
  };

  return { inputRef, close, handleKeyDown, fieldProps };
}
