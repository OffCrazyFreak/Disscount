import {
  productNavItems,
  productsNavItem,
  userNavItems,
  type INavigationItem,
} from "@/constants/navigation";
import type { ModalTarget } from "@/lib/modal/modal-registry";

export interface IBottomNavItem {
  item: INavigationItem;
  /** The raised centre cell, which opens the search sheet instead of navigating */
  isSearch?: boolean;
  /** Opened by a long press; every target is also reachable by a visible control */
  longPressTarget?: ModalTarget;
  /** Lets a target be wired ahead of the feature it belongs to */
  longPressEnabled?: boolean;
}

// Both groups, since the bar draws from the account section and the catalogue.
function navItem(id: string): INavigationItem {
  const found = [...userNavItems, ...productNavItems].find(
    (item) => item.id === id,
  );
  if (!found) throw new Error(`Unknown navigation item: ${id}`);

  return found;
}

/**
 * Five destinations, search dead centre. The two coming-soon items sit on the
 * outer edges, which are the hardest thumb positions, and the arrangement stays
 * symmetric. Order is deliberate and must not change once shipped: a tab bar
 * whose shape shifts between sessions cannot build muscle memory.
 */
export const bottomNavItems: IBottomNavItem[] = [
  { item: navItem("map") },
  { item: navItem("watchlist") },
  { item: productsNavItem, isSearch: true },
  {
    item: navItem("shopping-lists"),
    longPressTarget: { name: "shopping-list", action: "new" },
    longPressEnabled: true,
  },
  {
    item: navItem("digital-cards"),
    longPressTarget: { name: "digital-card", action: "new" },
    // TODO: flip to true when digital cards ship. Wired now so the gesture
    // plumbing never has to be revisited, but inert while the tab is a teaser.
    longPressEnabled: false,
  },
];

/** Index of the centre cell, so the layout can raise it without a lookup */
export const BOTTOM_NAV_SEARCH_INDEX = bottomNavItems.findIndex(
  (entry) => entry.isSearch,
);
