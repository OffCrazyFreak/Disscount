"use client";

import { useTranslations } from "next-intl";
import { SidebarMenuBadge, SidebarMenuButton } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { PLACEHOLDER_HREF, type INavigationItem } from "@/constants/navigation";
import { formatBadgeCount } from "@/utils/badge-count";
import SidebarNavLink from "@/components/custom/sidebar/sidebar-nav-link";
import { SIDEBAR_ICON_CLASS } from "@/components/custom/sidebar/sidebar-styles";

// Opts out of the peer rules that would recolour badge text on hover or active.
const BADGE_CLASS =
  "bg-primary text-primary-foreground peer-hover/menu-button:text-primary-foreground peer-data-[active=true]/menu-button:text-primary-foreground";

interface ISidebarNavItemProps {
  item: INavigationItem;
  isActive?: boolean;
  /** Coming-soon items are disabled for everyone but admins */
  isLocked?: boolean;
  /** Shown as a badge when the item opts in through `badge` */
  badgeCount?: number;
  /** The link's accessible name while it shows a count, so the number is not visual only */
  badgeLabel?: string;
}

export default function SidebarNavItem({
  item,
  isActive = false,
  isLocked = false,
  badgeCount,
  badgeLabel,
}: ISidebarNavItemProps) {
  const t = useTranslations("shell");
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
      <span>{t(item.labelKey)}</span>
    </>
  );

  return (
    <>
      {isDeadEnd ? (
        <SidebarMenuButton
          type="button"
          disabled
          className={cn(labelSpace, SIDEBAR_ICON_CLASS)}
        >
          {label}
        </SidebarMenuButton>
      ) : (
        <SidebarNavLink
          href={item.href}
          isActive={isActive}
          isLocked={isLocked}
          ariaLabel={showCount ? badgeLabel : undefined}
          className={cn(labelSpace, SIDEBAR_ICON_CLASS)}
        >
          {label}
        </SidebarNavLink>
      )}

      {showComingSoon && (
        <SidebarMenuBadge className={BADGE_CLASS}>
          {t("sidebar.comingSoon")}
        </SidebarMenuBadge>
      )}

      {showCount && (
        <SidebarMenuBadge
          aria-hidden="true"
          className={cn(BADGE_CLASS, "rounded-full")}
        >
          {formatBadgeCount(badgeCount ?? 0)}
        </SidebarMenuBadge>
      )}
    </>
  );
}
