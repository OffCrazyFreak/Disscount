import { openModalUrl } from "@/lib/modal/modal-navigation";
import type { IBottomNavItem } from "@/components/custom/bottom-nav/bottom-nav-items";

interface IHoldContext {
  /** The product whose page is open, which takes over the cells that can act on it */
  productEan: string | null;
  isLocked: boolean;
  openScanner: () => void;
}

/** One answer for firing and enablement, so the two cannot drift apart. */
export default function resolveHoldTarget(
  entry: IBottomNavItem,
  { productEan, isLocked, openScanner }: IHoldContext,
): (() => void) | null {
  if (isLocked) return null;

  if (entry.isSearch) return openScanner;

  if (productEan && entry.productPageTarget) {
    const target = entry.productPageTarget(productEan);

    return () => openModalUrl(target);
  }

  if (!entry.longPressEnabled || !entry.longPressTarget) return null;

  const target = entry.longPressTarget;

  return () => openModalUrl(target);
}
