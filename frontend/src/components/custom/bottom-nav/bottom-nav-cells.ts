import {
  digitalCardsNavItem,
  mapNavItem,
  productsNavItem,
  shoppingListsNavItem,
  watchlistNavItem,
  type INavigationItem,
} from "@/constants/navigation";

export type BottomNavHoldTarget =
  | "store-preferences"
  | "scanner"
  | "watch-product"
  | "add-to-list"
  | "new-shopping-list"
  | "new-digital-card";

/** Live state drawn concentric with the active disc or on the icon */
export type BottomNavIndicator = "badge" | "completion-ring";

export interface IBottomNavCell {
  item: INavigationItem;
  indicator?: BottomNavIndicator;
  /** The filled brand circle, centre cell only */
  raised?: boolean;
  /** Toggles the search sheet instead of navigating */
  togglesSearchSheet?: boolean;
  hold?: BottomNavHoldTarget;
  /** Replaces `hold` on a single product's page */
  productHold?: BottomNavHoldTarget;
}

export const CENTRE_INDEX = 2;

/**
 * Left to right, and the order must never change once shipped: a tab set whose
 * shape shifts between sessions cannot build muscle memory. The two teasers take
 * the outer edges so search stays dead centre and they take the worst reaches.
 *
 * Nothing here is auth-gated. The protected pages explain themselves and offer
 * sign-in, which beats dead-ending a cell.
 */
export const BOTTOM_NAV_CELLS: IBottomNavCell[] = [
  { item: mapNavItem, hold: "store-preferences" },
  { item: watchlistNavItem, indicator: "badge", productHold: "watch-product" },
  {
    item: productsNavItem,
    raised: true,
    togglesSearchSheet: true,
    hold: "scanner",
  },
  {
    item: shoppingListsNavItem,
    indicator: "completion-ring",
    hold: "new-shopping-list",
    productHold: "add-to-list",
  },
  { item: digitalCardsNavItem, hold: "new-digital-card" },
];
