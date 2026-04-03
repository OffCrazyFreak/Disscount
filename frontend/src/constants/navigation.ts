import {
  ListChecks,
  Eye,
  CreditCard,
  Percent,
  List,
  Store,
  MapPin,
  ChartNoAxesCombined,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavigationItem {
  id: string;
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: boolean; // For items that can show badge counts
  showInHeader: boolean; // Show in desktop header navigation
  isCollapsible?: boolean; // Has sub-menu (Kategorije, Trgovine, Lokacije)
}

// Primary navigation items (shown in header on desktop, top of sidebar on mobile)
export const userNavItems: NavigationItem[] = [
  {
    id: "shopping-lists",
    href: "/shopping-lists",
    label: "Popisi za kupnju",
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
    label: "Digitalne kartice",
    icon: CreditCard,

    showInHeader: true,
  },
  {
    id: "statistics",
    href: "/statistics",
    label: "Statistika",
    icon: ChartNoAxesCombined,

    showInHeader: false,
  },
];

export const productNavItems: NavigationItem[] = [
  {
    id: "discounted",
    href: "/products?discounted=true",
    label: "Sniženja",
    icon: Percent,

    showInHeader: false,
  },
  {
    id: "categories",
    href: "#",
    label: "Kategorije",
    icon: List,

    showInHeader: false,
    isCollapsible: true,
  },
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
];
