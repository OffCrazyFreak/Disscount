import { usePathname } from "@/i18n/navigation";
import { useUser } from "@/context/user-context";
import { useTranslations } from "next-intl";
import { canAccessDashboard } from "@/lib/api/schemas/auth-user";
import { useWatchlistPriceDropCount } from "@/lib/watchlist/use-watchlist-price-drop-count";
import {
  userNavItems,
  dashboardNavItem,
  isNavItemLocked,
} from "@/constants/navigation";
import HeaderNavItem from "@/components/custom/header/components/header-nav-item";

export default function HeaderNav() {
  const t = useTranslations("shell");
  const { user } = useUser();
  const pathname = usePathname();
  const { count: priceDropCount } = useWatchlistPriceDropCount();

  // Admins take the dashboard branch, so the user items below only ever render
  // for a non-admin. The lock still has to be asked for, but it can come from the
  // shared rule rather than a local condition that cannot vary here.
  const showDashboard = canAccessDashboard(user?.accountType);

  return (
    <ul className="mr-auto hidden gap-8 text-sm md:flex">
      {showDashboard ? (
        <HeaderNavItem item={dashboardNavItem} pathname={pathname} />
      ) : (
        userNavItems
          .filter((item) => item.showInHeader)
          .map((item) => (
            <HeaderNavItem
              key={item.id}
              item={item}
              pathname={pathname}
              badgeCount={
                item.badge && priceDropCount > 0 ? priceDropCount : undefined
              }
              badgeLabel={t("nav.watchlistPriceDrops", {
                label: t(item.shortLabelKey ?? item.labelKey),
                count: priceDropCount,
              })}
              isLocked={isNavItemLocked(item, user?.accountType)}
            />
          ))
      )}
    </ul>
  );
}
