import { openModalUrl } from "@/lib/modal/modal-navigation";
import type { IBottomNavItem } from "@/components/custom/bottom-nav/bottom-nav-items";

interface IHoldContext {
  /** The product whose page is open, which takes over the cells that can act on it */
  productEan: string | null;
  isLocked: boolean;
  openScanner: () => void;
}

/**
 * The one answer to both "what does this hold do" and "does this cell hold at
 * all", so the firing path and the enablement check cannot drift apart.
 *
 * On a product's page the cells act on that product instead: Praćenje watches
 * it, Popisi adds it to a list. Elsewhere they fall back to their own target,
 * which for Praćenje is nothing at all.
 */
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
