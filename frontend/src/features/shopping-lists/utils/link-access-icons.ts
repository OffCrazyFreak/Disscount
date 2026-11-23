import { Eye, Lock, Pencil, ShoppingCart } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { LinkAccess } from "@/lib/api/types";

/** Kept apart from `link-access-copy.ts` because that file is strings and this one pulls in components. */
export const LINK_ACCESS_ICONS: Record<LinkAccess, LucideIcon> = {
  NONE: Lock,
  VIEW: Eye,
  SHOP: ShoppingCart,
  EDIT: Pencil,
};
