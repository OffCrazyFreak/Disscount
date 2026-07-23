"use client";

import Link from "next/link";
import { SidebarMenuBadge, SidebarMenuButton } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import type { INavigationItem } from "@/constants/navigation";

// Badges keep their own fill, so they opt out of the peer rules that would
// otherwise recolour their text to follow an active or hovered item.
const BADGE_CLASS =
  "bg-primary text-primary-foreground peer-hover/menu-button:text-primary-foreground peer-data-[active=true]/menu-button:text-primary-foreground";

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

  // Badges are positioned absolutely, so the label needs room to truncate
  // against rather than running underneath them.
  const labelSpace = showComingSoon ? "pr-16" : showCount ? "pr-8" : undefined;

  return (
    <>
      {isLocked ? (
        <SidebarMenuButton type="button" disabled className={labelSpace}>
          <Icon />
          <span>{item.label}</span>
        </SidebarMenuButton>
      ) : (
        <SidebarMenuButton asChild isActive={isActive} className={labelSpace}>
          <Link href={item.href}>
            <Icon />
            <span>{item.label}</span>
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
