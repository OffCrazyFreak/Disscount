"use client";

import type { MouseEvent } from "react";

interface ISkipLinkAnchorProps {
  targetId: string;
  label: string;
}

/** Client half of SkipLink, which sits outside the translations provider and passes its label in. */
export default function SkipLinkAnchor({
  targetId,
  label,
}: ISkipLinkAnchorProps) {
  // Tabs keep the open tab in the URL hash, so following the fragment would reset it (#637).
  function focusTarget(event: MouseEvent<HTMLAnchorElement>) {
    // A modified click opens a new tab, which has no tab state to lose.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;

    const target = document.getElementById(targetId);
    if (!target) return;

    event.preventDefault();
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: "start" });
  }

  return (
    <a
      href={`#${targetId}`}
      onClick={focusTarget}
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[var(--z-skip-link)] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-lg focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2"
    >
      {label}
    </a>
  );
}
