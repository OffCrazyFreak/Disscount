"use client";

import { usePathname } from "next/navigation";
import { useUser } from "@/context/user-context";
import { isRouteActive } from "@/utils/routes";
import { isNavItemLocked } from "@/constants/navigation";
import {
  bottomNavItems,
  type IBottomNavItem,
} from "@/components/custom/bottom-nav/bottom-nav-items";

export interface IBottomNavCell {
  entry: IBottomNavItem;
  /** Route match, which drives styling. Activation is a separate question */
  isActive: boolean;
  /** A coming-soon cell nobody but an admin may open, as in the sidebar */
  isLocked: boolean;
}

/**
 * The five cells with their route and permission state already resolved, so the
 * bar itself only has to answer what a press does.
 */
export default function useBottomNavCells(): IBottomNavCell[] {
  const pathname = usePathname();
  const { user } = useUser();

  return bottomNavItems.map((entry) => ({
    entry,
    isActive: isRouteActive(pathname, entry.item.href),
    isLocked: isNavItemLocked(entry.item, user?.accountType),
  }));
}
