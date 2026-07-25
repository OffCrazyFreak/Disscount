"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useUser } from "@/context/user-context";
import { useNotifications } from "@/context/notifications-context";
import { isAdmin } from "@/lib/api/schemas/auth-user";
import {
  productEanFromPathname,
  shoppingListIdFromPathname,
} from "@/utils/routes";
import {
  BOTTOM_NAV_CELLS,
  CENTRE_INDEX,
} from "@/components/custom/bottom-nav/bottom-nav-cells";

export interface IBottomNavState {
  activeIndex: number;
  /** Where the disc sits, which outlives a route that matches no cell */
  discIndex: number;
  discVisible: boolean;
  isLocked: (index: number) => boolean;
  notificationCount: number;
  productEan: string | null;
  shoppingListId: string | null;
}

function matchIndex(pathname: string): number {
  return BOTTOM_NAV_CELLS.findIndex(
    ({ item }) =>
      pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
}

/**
 * Active means route match and nothing else. Whether a cell navigates or opens a
 * sheet is a separate question, so the centre cell lights up on /products too.
 *
 * Reads no search params: that would force the bar behind a Suspense boundary
 * and drop it out of the prerendered HTML.
 */
export default function useBottomNavState(): IBottomNavState {
  const pathname = usePathname();
  const { user } = useUser();
  const { notifications } = useNotifications();

  const activeIndex = matchIndex(pathname);

  // Held above the disc, so the previous route's position survives a navigation
  // and the disc slides rather than popping.
  const [lastIndex, setLastIndex] = useState(CENTRE_INDEX);
  if (activeIndex >= 0 && activeIndex !== lastIndex) setLastIndex(activeIndex);

  const userIsAdmin = isAdmin(user?.accountType);

  return {
    activeIndex,
    discIndex: activeIndex >= 0 ? activeIndex : lastIndex,
    // The tint reads as a smudge behind the raised circle, so it fades there.
    discVisible: activeIndex >= 0 && activeIndex !== CENTRE_INDEX,
    isLocked: (index) =>
      Boolean(BOTTOM_NAV_CELLS[index]?.item.comingSoon) && !userIsAdmin,
    notificationCount: notifications.length,
    productEan: productEanFromPathname(pathname),
    shoppingListId: shoppingListIdFromPathname(pathname),
  };
}
