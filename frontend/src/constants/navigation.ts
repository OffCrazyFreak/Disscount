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
  labelKey: NavKey;
  shortLabelKey?: NavKey;
  icon: LucideIcon;
  badge?: boolean;
  comingSoon?: boolean; // Read out by assistive tech; its presence opts the item into a PWA shortcut
  shortcutDescriptionKey?: NavKey;
  showInHeader: boolean;
  children?: readonly INavigationItem[];
}

export const homeNavItem = {
  id: "home",
  href: "/",
  labelKey: "nav.home",
  icon: House,

  showInHeader: false,
} as const satisfies INavigationItem;

// Lives in the desktop header, so the sidebar only surfaces it on mobile
export const dashboardNavItem = {
  id: "dashboard",
  href: "/dashboard",
  labelKey: "nav.dashboard",
  icon: LayoutDashboard,

  showInHeader: false,
} as const satisfies INavigationItem;

// The catalogue itself, which productNavItems only ever reached through filters
export const productsNavItem = {
  id: "products",
  href: "/products",
  labelKey: "nav.products",
  icon: Package,

  showInHeader: false,
} as const satisfies INavigationItem;

const userNavTable = [
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
    comingSoon: true,

    showInHeader: false,
  },
] as const satisfies readonly INavigationItem[];
export const userNavItems: readonly INavigationItem[] = userNavTable;

const productNavTable = [
  {
    id: "discounted",
    href: "/products?discounted=true",
    labelKey: "nav.discounted",
    icon: Percent,
    // TODO(#83): the price API cannot filter by discount yet.
    comingSoon: true,

    showInHeader: false,
  },
  {
    id: "map",
    href: "/map",
    labelKey: "nav.map",
    icon: MapIcon,
    shortcutDescriptionKey: "nav.mapShortcut",

    showInHeader: false,

    children: [
      {
        id: "stores",
        href: PLACEHOLDER_HREF,
        labelKey: "nav.stores",
        icon: Store,

        showInHeader: false,
      },
      {
        id: "locations",
        href: PLACEHOLDER_HREF,
        labelKey: "nav.locations",
        icon: MapPin,

        showInHeader: false,
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
] as const satisfies readonly INavigationItem[];
export const productNavItems: readonly INavigationItem[] = productNavTable;

const supportNavTable = [
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
] as const satisfies readonly INavigationItem[];
export const supportNavItems: readonly INavigationItem[] = supportNavTable;

const ALL_NAV_ITEMS = [
  homeNavItem,
  dashboardNavItem,
  productsNavItem,
  ...userNavTable,
  ...productNavTable,
  ...supportNavTable,
] as const satisfies readonly INavigationItem[];

type TopLevelNavItem = (typeof ALL_NAV_ITEMS)[number];

/** Derived from the table, so a mistyped or renamed id fails to compile. */
export type NavItemId =
  | TopLevelNavItem["id"]
  | Extract<
      TopLevelNavItem,
      { children: readonly INavigationItem[] }
    >["children"][number]["id"];

/** Throws because a bad id in this hardcoded table is a bug to surface at import. */
export function findNavItem(id: NavItemId): INavigationItem {
  const items: readonly INavigationItem[] = ALL_NAV_ITEMS;
  const found =
    items.find((item) => item.id === id) ??
    items
      .flatMap((item) => item.children ?? [])
      .find((child) => child.id === id);
  if (!found) throw new Error(`Unknown navigation item: ${id}`);

  return found;
}

/** One home for the coming-soon rule, which admins bypass to open what is not shipped yet. */
export function isNavItemLocked(
  item: INavigationItem,
  accountType?: AccountType | null,
): boolean {
  return Boolean(item.comingSoon) && !isAdmin(accountType);
}
