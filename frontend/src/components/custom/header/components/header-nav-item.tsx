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

            <ComingSoonBadge className="absolute -top-4.5 -right-7 rotate-6" />
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
            <Badge className="absolute -top-2 -right-3.5">
              {notificationCount}
            </Badge>
          )}
        </span>
      </Link>
    </li>
  );
}
