"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import { SidebarMenuBadge, SidebarMenuButton } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { PLACEHOLDER_HREF, type INavigationItem } from "@/constants/navigation";

// Opts out of the peer rules that would recolour badge text on hover or active.
const BADGE_CLASS =
  "bg-primary text-primary-foreground peer-hover/menu-button:text-primary-foreground peer-data-[active=true]/menu-button:text-primary-foreground";

function preventNavigation(event: MouseEvent<HTMLAnchorElement>) {
  event.preventDefault();
}

interface ISidebarNavItemProps {
  item: INavigationItem;
  isActive?: boolean;
  /** Coming-soon items are disabled for everyone but admins */
  isLocked?: boolean;
  /** Shown as a badge when the item opts in through `badge` */
  badgeCount?: number;
}

/** A sidebar link with its coming-soon or notification badge. */
export default function SidebarNavItem({
  item,
  isActive = false,
  isLocked = false,
  badgeCount,
}: ISidebarNavItemProps) {
  const Icon = item.icon;

  const showComingSoon = Boolean(item.comingSoon);
  const showCount = !showComingSoon && Boolean(badgeCount);

  // Badges are absolute, so the label needs room to truncate against.
  const labelSpace = showComingSoon ? "pr-16" : showCount ? "pr-8" : undefined;

  // A locked item stays an anchor so crawlers still reach the page behind it.
  const isDeadEnd = isLocked && item.href === PLACEHOLDER_HREF;

  const label = (
    <>
      <Icon />
      <span>{item.label}</span>
    </>
  );

  return (
    <>
      {isDeadEnd ? (
        <SidebarMenuButton type="button" disabled className={labelSpace}>
          {label}
        </SidebarMenuButton>
      ) : (
        <SidebarMenuButton
          asChild
          isActive={!isLocked && isActive}
          className={labelSpace}
        >
          <Link
            href={item.href}
            aria-disabled={isLocked ? true : undefined}
            tabIndex={isLocked ? -1 : undefined}
            onClick={isLocked ? preventNavigation : undefined}
          >
            {label}
          </Link>
        </SidebarMenuButton>
      )}

      {showComingSoon && (
        <SidebarMenuBadge className={BADGE_CLASS}>USKORO</SidebarMenuBadge>
      )}

      {showCount && (
        <SidebarMenuBadge className={cn(BADGE_CLASS, "rounded-full")}>
          {badgeCount}
        </SidebarMenuBadge>
      )}
    </>
  );
}
