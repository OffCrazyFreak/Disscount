import {
  findNavItem,
  productsNavItem,
  type INavigationItem,
} from "@/constants/navigation";
import type { ModalTarget } from "@/lib/modal/modal-registry";

export interface IBottomNavItem {
  item: INavigationItem;
  /** The raised centre cell, which opens the products sheet instead of navigating */
  isSearch?: boolean;
  /** Opened by a long press; every target is also reachable by a visible control */
  longPressTarget?: ModalTarget;
  /** Lets a target be wired ahead of the feature it belongs to */
  longPressEnabled?: boolean;
  /** Without a product the cell simply has no gesture on this page. */
  productPageTarget?: (ean: string) => ModalTarget;
}

/** Order must not change once shipped, because a tab bar whose shape shifts cannot build muscle memory; coming-soon items take the hardest thumb spots. */
export const bottomNavItems: IBottomNavItem[] = [
  {
    item: findNavItem("map"),
    // The map loads pinned stores and centres itself, so the only thing left to reach is where those preferences are set.
    longPressTarget: { name: "settings", tab: "preference" },
    longPressEnabled: true,
  },
  {
    item: findNavItem("watchlist"),
    productPageTarget: (ean) => ({ name: "watchlist", ean }),
  },
  { item: productsNavItem, isSearch: true },
  {
    item: findNavItem("shopping-lists"),
    longPressTarget: { name: "shopping-list", action: "new" },
    longPressEnabled: true,
    productPageTarget: (ean) => ({ name: "add-to-list", ean }),
  },
  {
    item: findNavItem("digital-cards"),
    longPressTarget: { name: "digital-card", action: "new" },
    longPressEnabled: true,
  },
];

/** Index of the centre cell, so the layout can raise it without a lookup */
export const BOTTOM_NAV_SEARCH_INDEX = bottomNavItems.findIndex(
  (entry) => entry.isSearch,
);
