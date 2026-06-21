import {
  ListChecks,
  Eye,
  CreditCard,
  Percent,
  List,
  Store,
  MapPin,
  Map as MapIcon,
  Wallet,
  ChartNoAxesCombined,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavigationItem {
  id: string;
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: boolean; // For items that can show badge counts
  comingSoon?: boolean; // Show an "USKORO" badge for not-yet-available features
  showInHeader: boolean; // Show in desktop header navigation
  isCollapsible?: boolean; // Has sub-menu (Kategorije, Trgovine, Lokacije)
}

// Primary navigation items (shown in header on desktop, top of sidebar on mobile)
export const userNavItems: NavigationItem[] = [
  {
    id: "shopping-lists",
    href: "/shopping-lists",
    label: "Popisi",
    icon: ListChecks,

    showInHeader: true,
  },
  {
    id: "watchlist",
    href: "/watchlist",
    label: "Praćenje",
    icon: Eye,
    badge: true,

    showInHeader: true,
  },
  {
    id: "digital-cards",
    href: "/digital-cards",
    label: "Kartice",
    icon: CreditCard,
    comingSoon: true,

    showInHeader: false,
  },
  {
    id: "statistics",
    href: "/statistics",
    label: "Statistika",
    icon: ChartNoAxesCombined,

    showInHeader: false,
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
  // {
  //   id: "discounted",
  //   href: "/products?discounted=true",
  //   label: "Popusti",
  //   icon: Percent,

  //   showInHeader: false,
  // },
  // {
  //   id: "categories",
  //   href: "#",
  //   label: "Kategorije",
  //   icon: List,

  //   showInHeader: false,
  //   isCollapsible: true,
  // },
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
  {
    id: "map",
    href: "/map",
    label: "Karta",
    icon: MapIcon,
    comingSoon: true,

    showInHeader: false,
  },
];
