import Link from "next/link";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import ComingSoonBadge from "@/components/custom/common/coming-soon-badge";
import type { NavigationItem } from "@/constants/navigation";

interface IHeaderNavItemProps {
  item: NavigationItem;
  pathname: string;
  hasNotifications: boolean;
  notificationCount: number;
}

export default function HeaderNavItem({
  item,
  pathname,
  hasNotifications,
  notificationCount,
}: IHeaderNavItemProps) {
  const Icon = item.icon;
  const isActive = pathname.startsWith(item.href);
  const label = item.shortLabel ?? item.label;

  // Coming-soon items are not navigable in the navbar; the
  // USKORO badge sits on top, like the notification badge.
  if (item.comingSoon) {
    return (
      <li>
        <span className="flex items-center space-x-2 text-muted-foreground/70 cursor-not-allowed relative">
          <Icon className="size-4" />
          <span className="relative">
            {label}

            <ComingSoonBadge className="absolute -top-3 -right-7 h-4 rounded-full px-1 py-0 text-[9px] sm:text-[9px] leading-none" />
          </span>
        </span>
      </li>
    );
  }

  return (
    <li>
      <Link
        href={item.href}
        className={cn(
          "flex items-center space-x-2 text-muted-foreground hover:text-accent-foreground duration-150 group hover:scale-110 relative",
          isActive && "font-bold text-primary",
        )}
      >
        <Icon
          className={cn(
            "size-4 group-hover:text-primary transition-colors",
            isActive && "text-primary",
          )}
        />
        <span
          className={cn(
            "group-hover:text-primary transition-colors relative",
            isActive && "text-primary",
          )}
        >
          {label}

          {item.badge && hasNotifications && (
            <Badge className="absolute -top-2 -right-3.5 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] sm:text-xs sm:shadow-sm">
              {notificationCount}
            </Badge>
          )}
        </span>
      </Link>
    </li>
  );
}
