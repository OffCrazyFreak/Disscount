"use client";

import { useCameraScanner } from "@/context/scanner-context";
import useProductNavigation from "@/hooks/use-product-navigation";
import { openModalUrl } from "@/lib/modal/modal-navigation";
import type { BottomNavHoldTarget } from "@/components/custom/bottom-nav/bottom-nav-cells";

/**
 * Every target is also reachable by a visible control, so the hold stays an
 * accelerator: the settings modal, the product's own action buttons, the search
 * field's scan button and each page's create button.
 *
 * The two ean-scoped targets only fire on a product's page, which already holds
 * that product in cache, so their modals never open empty.
 */
export default function useHoldActions() {
  const { openScanner } = useCameraScanner();
  const navigateToProduct = useProductNavigation();

  return function runHold(target: BottomNavHoldTarget, ean: string | null) {
    switch (target) {
      case "store-preferences":
        openModalUrl({ name: "settings", tab: "preference" });
        return;

      case "scanner":
        openScanner({ onScan: (code) => navigateToProduct(code.rawValue) });
        return;

      case "watch-product":
        if (ean) openModalUrl({ name: "watchlist", ean });
        return;

      case "add-to-list":
        if (ean) openModalUrl({ name: "add-to-list", ean });
        return;

      case "new-shopping-list":
        openModalUrl({ name: "shopping-list", action: "new" });
        return;

      case "new-digital-card":
        openModalUrl({ name: "digital-card", action: "new" });
        return;
    }
  };
}
