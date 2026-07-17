import {
  ListChecks,
  Eye,
  CreditCard,
  Percent,
  Store,
  MapPin,
  Map as MapIcon,
  Wallet,
  Megaphone,
  Lightbulb,
  ChartNoAxesCombined,
  LayoutDashboard,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavigationItem {
  id: string;
  href: string;
  label: string; // Full name, shown in the sidebar
  shortLabel?: string; // Shorter name shown in the cramped desktop header navbar
  icon: LucideIcon;
  badge?: boolean; // For items that can show badge counts
  comingSoon?: boolean; // Show an "USKORO" badge for not-yet-available features
  showInHeader: boolean; // Show in desktop header navigation
  isCollapsible?: boolean; // Has sub-menu (Kategorije, Trgovine, Lokacije)
  children?: NavigationItem[]; // Nested items shown indented under this one
}

// Lives in the desktop header, so the sidebar only surfaces it on mobile
export const dashboardNavItem: NavigationItem = {
  id: "dashboard",
  href: "/dashboard",
  label: "Nadzorna ploča",
  icon: LayoutDashboard,

  showInHeader: false,
};

// Primary navigation items (shown in header on desktop, top of sidebar on mobile)
export const userNavItems: NavigationItem[] = [
  {
    id: "shopping-lists",
    href: "/shopping-lists",
    label: "Popisi za kupnju",
    shortLabel: "Popisi",
    icon: ListChecks,

    showInHeader: true,
  },
  {
    id: "watchlist",
    href: "/watchlist",
    label: "Praćeni proizvodi",
    shortLabel: "Praćenje",
    icon: Eye,
    badge: true,

    showInHeader: true,
  },
  {
    id: "digital-cards",
    href: "/digital-cards",
    label: "Digitalne kartice",
    shortLabel: "Kartice",
    icon: CreditCard,
    comingSoon: true,

    showInHeader: true,
  },
  {
    id: "spending",
    href: "/spending",
    label: "Potrošnja",
    icon: Wallet,
    comingSoon: true,

    showInHeader: false,
  },
];

export const productNavItems: NavigationItem[] = [
  {
    id: "discounted",
    href: "/products?discounted=true",
    label: "Popusti",
    icon: Percent,
    comingSoon: true,

    showInHeader: false,
  },
  // {
  //   id: "categories",
  //   href: "#",
  //   label: "Kategorije",
  //   icon: List,

  //   showInHeader: false,
  //   isCollapsible: true,
  // },
  {
    id: "map",
    href: "/map",
    label: "Karta",
    icon: MapIcon,
    comingSoon: true,

    showInHeader: false,

    children: [
      {
        id: "stores",
        href: "#",
        label: "Trgovine",
        icon: Store,

        showInHeader: false,

        isCollapsible: true,
      },
      {
        id: "locations",
        href: "#",
        label: "Lokacije",
        icon: MapPin,

        showInHeader: false,

        isCollapsible: true,
      },
    ],
  },
  {
    id: "statistics",
    href: "/statistics",
    label: "Statistika",
    icon: ChartNoAxesCombined,
    comingSoon: true,

    showInHeader: false,
  },
  {
    id: "updates",
    href: "/updates",
    label: "Novosti",
    icon: Megaphone,
    comingSoon: true,

    showInHeader: false,
  },
  {
    id: "suggestions",
    href: "/suggestions",
    label: "Ideje i prijedlozi",
    icon: Lightbulb,
    comingSoon: true,

    showInHeader: false,
  },
];
