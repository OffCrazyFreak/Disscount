import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { useUser } from "@/context/user-context";
import { useNotifications } from "@/context/notifications-context";
import { canAccessDashboard } from "@/lib/api/schemas/auth-user";
import { userNavItems } from "@/constants/navigation";
import HeaderNavItem from "@/components/custom/header/components/header-nav-item";

export default function HeaderNav() {
  const { user } = useUser();
  const pathname = usePathname();

  const { notifications, hasNotifications } = useNotifications();

  const showDashboard = canAccessDashboard(user?.accountType);

  return (
    <ul className="hidden md:flex gap-8 text-sm">
      {showDashboard ? (
        <li>
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center space-x-2 text-muted-foreground hover:text-accent-foreground duration-150 group hover:scale-110 relative",
              pathname.startsWith("/dashboard") && "font-bold text-primary",
            )}
          >
            <LayoutDashboard
              className={cn(
                "size-4 group-hover:text-primary transition-colors",
                pathname.startsWith("/dashboard") && "text-primary",
              )}
            />
            <span className="group-hover:text-primary transition-colors">
              Nadzorna ploča
            </span>
          </Link>
        </li>
      ) : (
        userNavItems
          .filter((item) => item.showInHeader)
          .map((item) => (
            <HeaderNavItem
              key={item.id}
              item={item}
              pathname={pathname}
              hasNotifications={hasNotifications}
              notificationCount={notifications.length}
            />
          ))
      )}
    </ul>
  );
}
