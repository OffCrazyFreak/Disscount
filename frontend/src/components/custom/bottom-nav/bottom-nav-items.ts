import {
  findNavItem,
  productsNavItem,
  type INavigationItem,
} from "@/constants/navigation";

export type StaticHoldKind =
  "scan" | "store-preferences" | "new-list" | "new-card";

export type ProductHoldKind = "product-watch" | "product-to-list";

export interface IBottomNavCell {
  item: INavigationItem;
  /** The raised centre cell, which opens the search sheet instead of navigating */
  isCenter?: boolean;
  hold?: StaticHoldKind;
  /** Takes over on a product's own page, where the cell has a product to act on */
  productHold?: ProductHoldKind;
  /** Lets a hold be wired ahead of the feature it belongs to */
  holdDisabled?: boolean;
}

/**
 * Five destinations, search dead centre, the two coming-soon teasers on the
 * outer edges where the thumb reaches worst. The order must not change once
 * shipped: a tab bar whose shape shifts between sessions builds no muscle
 * memory. Each cell declares the kind of hold it has, never what the hold does.
 */
export const bottomNavCells: IBottomNavCell[] = [
  { item: findNavItem("map"), hold: "store-preferences" },
  { item: findNavItem("watchlist"), productHold: "product-watch" },
  { item: productsNavItem, isCenter: true, hold: "scan" },
  {
    item: findNavItem("shopping-lists"),
    hold: "new-list",
    productHold: "product-to-list",
  },
  {
    item: findNavItem("digital-cards"),
    hold: "new-card",
    // TODO: drop once digital cards ship, along with the item's comingSoon.
    holdDisabled: true,
  },
];

export const CENTER_INDEX = bottomNavCells.findIndex((cell) => cell.isCenter);
