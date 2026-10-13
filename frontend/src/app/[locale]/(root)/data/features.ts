import type { LucideIcon } from "lucide-react";
import {
  Scale,
  ChartLine,
  ListChecks,
  Eye,
  ScanBarcode,
  WifiOff,
  BellRing,
  CreditCard,
  Map as MapIcon,
  PiggyBank,
  Share2,
} from "lucide-react";

export type FeatureId =
  | "scanner"
  | "compare"
  | "history"
  | "lists"
  | "sharing"
  | "spending"
  | "watchlist"
  | "notifications"
  | "cards"
  | "offline"
  | "map";

export interface IFeatureItem {
  id: FeatureId;
  icon: LucideIcon;
  comingSoon?: boolean;
  /** Link target; leave commented on coming-soon items until their page ships */
  href?: string;
  /** Client action instead of a link */
  action?: "scanner" | "notifications";
}

export const featureItems: IFeatureItem[] = [
  {
    id: "scanner",
    icon: ScanBarcode,
    action: "scanner",
  },
  {
    id: "compare",
    icon: Scale,
    href: "/products",
  },
  {
    id: "history",
    icon: ChartLine,
    href: "/products",
  },
  {
    id: "lists",
    icon: ListChecks,
    href: "/shopping-lists",
  },
  {
    id: "sharing",
    icon: Share2,
    href: "/shopping-lists",
  },
  {
    id: "spending",
    icon: PiggyBank,
    comingSoon: true,
    // href: "/spending",
  },
  {
    id: "watchlist",
    icon: Eye,
    href: "/watchlist",
  },
  {
    id: "notifications",
    icon: BellRing,
    action: "notifications",
  },
  {
    id: "cards",
    icon: CreditCard,
    href: "/digital-cards",
  },
  {
    id: "offline",
    icon: WifiOff,
  },
  {
    id: "map",
    icon: MapIcon,
    href: "/map",
  },
];
