import { usePathname } from "next/navigation";
import { useUser } from "@/context/user-context";
import { useNotifications } from "@/context/notifications-context";
import { canAccessDashboard } from "@/lib/api/schemas/auth-user";
import { userNavItems, dashboardNavItem } from "@/constants/navigation";
import HeaderNavItem from "@/components/custom/header/components/header-nav-item";

export default function HeaderNav() {
  const { user } = useUser();
  const pathname = usePathname();

  const { notifications, hasNotifications } = useNotifications();

  const showDashboard = canAccessDashboard(user?.accountType);

  return (
    <ul className="hidden md:flex gap-8 text-sm">
      {showDashboard ? (
        <HeaderNavItem
          item={dashboardNavItem}
          pathname={pathname}
          hasNotifications={hasNotifications}
          notificationCount={notifications.length}
        />
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
