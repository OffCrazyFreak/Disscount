import {
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

function navItem(id: string): INavigationItem {
  const found = userNavItems.find((item) => item.id === id);
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
  { item: navItem("spending") },
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
    // Wired now, inert while the tab is a teaser. Flip this the day the feature
    // ships rather than revisiting the gesture plumbing.
    longPressEnabled: false,
  },
];

/** Index of the centre cell, so the layout can raise it without a lookup */
export const BOTTOM_NAV_SEARCH_INDEX = bottomNavItems.findIndex(
  (entry) => entry.isSearch,
);
