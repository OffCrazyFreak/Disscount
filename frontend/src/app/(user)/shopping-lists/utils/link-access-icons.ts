import { Eye, Lock, Pencil, ShoppingCart } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { LinkAccess } from "@/lib/api/types";

/**
 * One icon per level, so the share modal's row, its select and the banner a recipient sees
 * all point at the same picture for the same thing. Kept apart from `link-access-copy.ts`
 * because that file is strings and this one pulls in components.
 *
 * Deliberately not reused by `shopping-list-visibility-indicator.tsx`, which stays binary
 * Lock and Globe: on a card it answers "is this shared at all" at a glance, and the level
 * lives in its tooltip.
 */
export const LINK_ACCESS_ICONS: Record<LinkAccess, LucideIcon> = {
  NONE: Lock,
  VIEW: Eye,
  SHOP: ShoppingCart,
  EDIT: Pencil,
};
