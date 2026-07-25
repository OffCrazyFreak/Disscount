"use client";

import { usePathname } from "next/navigation";
import { useNotifications } from "@/context/notifications-context";
import { useUser } from "@/context/user-context";
import { isAdmin } from "@/lib/api/schemas/auth-user";
import {
  bottomNavCells,
  type IBottomNavCell,
} from "@/components/custom/bottom-nav/bottom-nav-items";

export interface IBottomNavCellView {
  cell: IBottomNavCell;
  isActive: boolean;
  isLocked: boolean;
  badgeCount?: number;
}

/**
 * Route match is a pure prefix test over every cell, the centre one included, so
 * the products tab lights up on its own route. What a tap *does* is a separate
 * question, answered by the cell's own isCenter flag.
 */
export default function useBottomNavCells(): IBottomNavCellView[] {
  const pathname = usePathname();
  const { user } = useUser();
  const { notifications, hasNotifications } = useNotifications();

  const userIsAdmin = isAdmin(user?.accountType);

  return bottomNavCells.map((cell) => ({
    cell,
    isActive: pathname.startsWith(cell.item.href),
    isLocked: Boolean(cell.item.comingSoon) && !userIsAdmin,
    badgeCount:
      cell.item.badge && hasNotifications ? notifications.length : undefined,
  }));
}
