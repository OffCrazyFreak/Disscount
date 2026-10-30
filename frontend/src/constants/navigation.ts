import {
  ListChecks,
  Eye,
  CreditCard,
  Percent,
  Store,
  MapPin,
  Map as MapIcon,
  PiggyBank,
  Megaphone,
  Lightbulb,
  ChartNoAxesCombined,
  LayoutDashboard,
  Bug,
  HeartHandshake,
  Mail,
  Package,
  House,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type shell from "@/i18n/messages/hr/shell.json";
import { isAdmin, type AccountType } from "@/lib/api/schemas/auth-user";

/** Keys into the `shell` namespace, translated where the item is rendered. */
export type NavKey = `nav.${keyof typeof shell.nav}`;

/** Destination for items whose page does not exist yet. */
export const PLACEHOLDER_HREF = "#";

export interface INavigationItem {
  id: string;
  href: string;
  labelKey: NavKey; // Full name, shown in the sidebar
  shortLabelKey?: NavKey; // Shorter name shown in the cramped desktop header navbar
  icon: LucideIcon;
  badge?: boolean; // For items that can show badge counts
  comingSoon?: boolean; // Show an "USKORO" badge for not-yet-available features
  shortcutDescriptionKey?: NavKey; // Read out by assistive tech; its presence opts the item into a PWA shortcut
  showInHeader: boolean; // Show in desktop header navigation
  isCollapsible?: boolean; // Has sub-menu (Kategorije, Trgovine, Lokacije)
  children?: INavigationItem[]; // Nested items shown indented under this one
}

export const homeNavItem: INavigationItem = {
  id: "home",
  href: "/",
  labelKey: "nav.home",
  icon: House,

  showInHeader: false,
};

// Lives in the desktop header, so the sidebar only surfaces it on mobile
export const dashboardNavItem: INavigationItem = {
  id: "dashboard",
  href: "/dashboard",
  labelKey: "nav.dashboard",
  icon: LayoutDashboard,

  showInHeader: false,
};

// The catalogue itself, which productNavItems only ever reached through filters
export const productsNavItem: INavigationItem = {
  id: "products",
  href: "/products",
  labelKey: "nav.products",
  icon: Package,

  showInHeader: false,
};

// Primary navigation items (shown in header on desktop, top of sidebar on mobile)
export const userNavItems: INavigationItem[] = [
  {
    id: "shopping-lists",
    href: "/shopping-lists",
    labelKey: "nav.shoppingLists",
    shortLabelKey: "nav.shoppingListsShort",
    icon: ListChecks,
    shortcutDescriptionKey: "nav.shoppingListsShortcut",

    showInHeader: true,
  },
  {
    id: "watchlist",
    href: "/watchlist",
    labelKey: "nav.watchlist",
    shortLabelKey: "nav.watchlistShort",
    icon: Eye,
    badge: true,
    shortcutDescriptionKey: "nav.watchlistShortcut",

    showInHeader: true,
  },
  {
    id: "digital-cards",
    href: "/digital-cards",
    labelKey: "nav.digitalCards",
    shortLabelKey: "nav.digitalCardsShort",
    icon: CreditCard,
    shortcutDescriptionKey: "nav.digitalCardsShortcut",

    showInHeader: true,
  },
  {
    id: "spending",
    href: "/spending",
    labelKey: "nav.spending",
    icon: PiggyBank,
    shortcutDescriptionKey: "nav.spendingShortcut",
    // TODO(#127): generate its PWA shortcut icon before dropping this flag.
    comingSoon: true,

    showInHeader: false,
  },
];

export const productNavItems: INavigationItem[] = [
  {
    id: "discounted",
    href: "/products?discounted=true",
    labelKey: "nav.discounted",
    icon: Percent,
    // TODO(#83): the price API cannot filter by discount yet.
    comingSoon: true,

    showInHeader: false,
  },
  // TODO(#82): parked until the price API exposes a category taxonomy.
  // {
  //   id: "categories",
  //   href: "#",
  //   labelKey: "nav.categories",
  //   icon: List,

  //   showInHeader: false,
  //   isCollapsible: true,
  // },
  // TODO(#84): parked until the price API can list and filter by brand.
  // {
  //   id: "brands",
  //   href: "#",
  //   labelKey: "nav.brands",
  //   icon: Tag,

  //   showInHeader: false,
  //   isCollapsible: true,
  // },
  {
    id: "map",
    href: "/map",
    labelKey: "nav.map",
    icon: MapIcon,
    // TODO(#127): manifest.ts only reads userNavItems, so a PWA shortcut for
    // this one needs adding by hand.

    showInHeader: false,

    children: [
      {
        id: "stores",
        href: PLACEHOLDER_HREF,
        labelKey: "nav.stores",
        icon: Store,

        showInHeader: false,

        isCollapsible: true,
      },
      {
        id: "locations",
        href: PLACEHOLDER_HREF,
        labelKey: "nav.locations",
        icon: MapPin,

        showInHeader: false,

        isCollapsible: true,
      },
    ],
  },
  {
    id: "statistics",
    href: "/statistics",
    labelKey: "nav.statistics",
    icon: ChartNoAxesCombined,
    comingSoon: true,

    showInHeader: false,
  },
  {
    id: "updates",
    href: "/updates",
    labelKey: "nav.updates",
    icon: Megaphone,
    comingSoon: true,

    showInHeader: false,
  },
];

// Support entry points, shared with the footer; coming-soon until their pages/modals ship.
export const supportNavItems: INavigationItem[] = [
  {
    id: "suggestions",
    href: "/suggestions",
    labelKey: "nav.suggestions",
    icon: Lightbulb,
    comingSoon: true,

    showInHeader: false,
  },
  {
    id: "bug-report",
    href: PLACEHOLDER_HREF,
    labelKey: "nav.bugReport",
    icon: Bug,
    comingSoon: true,

    showInHeader: false,
  },
  {
    id: "contact",
    href: "?modal=contact",
    labelKey: "nav.contact",
    icon: Mail,

    showInHeader: false,
  },
  {
    id: "donate",
    href: "?modal=donate",
    labelKey: "nav.donate",
    icon: HeartHandshake,

    showInHeader: false,
  },
];

const ALL_NAV_ITEMS: INavigationItem[] = [
  homeNavItem,
  dashboardNavItem,
  productsNavItem,
  ...userNavItems,
  ...productNavItems,
  ...supportNavItems,
];

/**
 * Every group and their children, so an id cannot resolve on one surface and
 * throw on another. The throw is deliberate fail-fast: the table is hardcoded, so
 * a bad id is a bug to surface at import rather than render as an empty cell.
 */
export function findNavItem(id: string): INavigationItem {
  const found =
    ALL_NAV_ITEMS.find((item) => item.id === id) ??
    ALL_NAV_ITEMS.flatMap((item) => item.children ?? []).find(
      (child) => child.id === id,
    );
  if (!found) throw new Error(`Unknown navigation item: ${id}`);

  return found;
}

/**
 * One home for the coming-soon rule, which six navigation surfaces were each
 * deriving for themselves. Admins get to open what is not shipped yet.
 */
export function isNavItemLocked(
  item: INavigationItem,
  accountType?: AccountType | null,
): boolean {
  return Boolean(item.comingSoon) && !isAdmin(accountType);
}
