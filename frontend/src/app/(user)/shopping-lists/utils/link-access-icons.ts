import { Eye, Lock, Pencil, ShoppingCart } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { LinkAccess } from "@/lib/api/types";

/**
 * One icon per level, for every surface that shows one: the share modal's row and select,
 * the banner a recipient sees, and the indicator on a list card. A list therefore shows the
 * same picture wherever you meet it.
 *
 * Kept apart from `link-access-copy.ts` because that file is strings and this one pulls in
 * components.
 */
export const LINK_ACCESS_ICONS: Record<LinkAccess, LucideIcon> = {
  NONE: Lock,
  VIEW: Eye,
  SHOP: ShoppingCart,
  EDIT: Pencil,
};
