import { usePathname } from "next/navigation";
import { useUser } from "@/context/user-context";
import { useNotifications } from "@/context/notifications-context";
import { canAccessDashboard } from "@/lib/api/schemas/auth-user";
import {
  userNavItems,
  dashboardNavItem,
  isNavItemLocked,
} from "@/constants/navigation";
import HeaderNavItem from "@/components/custom/header/components/header-nav-item";

export default function HeaderNav() {
  const { user } = useUser();
  const pathname = usePathname();

  const { notifications, hasNotifications } = useNotifications();

  // Admins take the dashboard branch, so the user items below only ever render
  // for a non-admin. The lock still has to be asked for, but it can come from the
  // shared rule rather than a local condition that cannot vary here.
  const showDashboard = canAccessDashboard(user?.accountType);

  return (
    <ul className="mr-auto hidden gap-8 text-sm md:flex">
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
              isLocked={isNavItemLocked(item, user?.accountType)}
            />
          ))
      )}
    </ul>
  );
}
