"use client";

import { Link } from "@/i18n/navigation";
import type { MouseEvent, ReactNode } from "react";

import { cn } from "@/lib/utils";

interface IStretchedLinkProps {
  href: string;
  /** Returning false cancels navigation, so a fired long press can suppress it. */
  onNavigate?: (viaKeyboard: boolean) => boolean | void;
  className?: string;
  children: ReactNode;
}

/** Children stay selectable through `relative z-10` and controls through `relative z-20`; the root needs `relative isolate` or those layers paint over the header. */
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
