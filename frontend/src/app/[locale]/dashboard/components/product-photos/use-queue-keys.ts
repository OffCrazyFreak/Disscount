import { useEffect, useEffectEvent } from "react";

interface IQueueKeys {
  onNext: () => void;
  onPrevious: () => void;
  onReviewed: () => void;
}

/** J and K move through the queue, R marks the product reviewed and moves on; typing and dialogs are left alone. */
export function useQueueKeys({ onNext, onPrevious, onReviewed }: IQueueKeys) {
  const handle = useEffectEvent((event: KeyboardEvent) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const target = event.target;
    if (
      target instanceof Element &&
      target.closest(
        "input, textarea, select, [contenteditable='true'], [role='dialog']",
      )
    )
      return;
    if (document.querySelector("[role='dialog']")) return;

    const key = event.key.toLowerCase();
    if (key === "j") onNext();
    else if (key === "k") onPrevious();
    else if (key === "r") onReviewed();
    else return;
    event.preventDefault();
  });

  useEffect(() => {
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, []);
}
