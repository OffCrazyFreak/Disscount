"use client";

import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";

import { cn } from "@/lib/utils";

interface IStretchedLinkProps {
  href: string;
  /** Returning false cancels navigation, so a fired long press can suppress it. */
  onNavigate?: (viaKeyboard: boolean) => boolean | void;
  className?: string;
  children: ReactNode;
}

/**
 * Wraps a card's title and stretches its hit area over the whole card through a
 * pseudo-element, so the card navigates without an anchor sitting on top of the
 * content.
 *
 * The children matter: text inside an anchor is both clickable and drag
 * selectable, which a full-card overlay link is not. Anything outside this link
 * that should stay selectable needs `relative z-10` to sit above the ::after,
 * and interactive controls need `relative z-20` to sit above both.
 *
 * The nearest positioned ancestor owns the stretch, so the card root must be
 * `relative`.
 */
export default function StretchedLink({
  href,
  onNavigate,
  className,
  children,
}: IStretchedLinkProps) {
  function handleNavigate(event: MouseEvent<HTMLAnchorElement>) {
    if (onNavigate?.(event.detail === 0) === false) {
      event.preventDefault();
    }
  }

  return (
    <Link
      href={href}
      onClick={handleNavigate}
      className={cn(
        "after:absolute after:inset-0 after:rounded-[inherit] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
    >
      {children}
    </Link>
  );
}
