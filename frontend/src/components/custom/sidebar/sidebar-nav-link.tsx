"use client";

import type { MouseEvent, ReactNode } from "react";

import { Link } from "@/i18n/navigation";
import { SidebarMenuButton } from "@/components/ui/sidebar";

function preventNavigation(event: MouseEvent<HTMLAnchorElement>) {
  event.preventDefault();
}

interface ISidebarNavLinkProps {
  href: string;
  isActive: boolean;
  isLocked: boolean;
  ariaLabel?: string;
  className: string;
  children: ReactNode;
}

export default function SidebarNavLink({
  href,
  isActive,
  isLocked,
  ariaLabel,
  className,
  children,
}: ISidebarNavLinkProps) {
  const isCurrent = !isLocked && isActive;

  return (
    <SidebarMenuButton asChild isActive={isCurrent} className={className}>
      <Link
        href={href}
        // data-active styles it, but says nothing to a screen reader.
        aria-current={isCurrent ? "page" : undefined}
        aria-label={ariaLabel}
        aria-disabled={isLocked ? true : undefined}
        tabIndex={isLocked ? -1 : undefined}
        onClick={isLocked ? preventNavigation : undefined}
      >
        {children}
      </Link>
    </SidebarMenuButton>
  );
}
