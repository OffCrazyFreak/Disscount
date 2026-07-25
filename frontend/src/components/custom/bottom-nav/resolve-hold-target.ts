import { openModalUrl } from "@/lib/modal/modal-navigation";
import type {
  IBottomNavCell,
  ProductHoldKind,
  StaticHoldKind,
} from "@/components/custom/bottom-nav/bottom-nav-items";

interface IHoldContext {
  productEan: string | null;
  openScanner: () => void;
}

function productHoldAction(kind: ProductHoldKind, ean: string): () => void {
  switch (kind) {
    case "product-watch":
      return () => openModalUrl({ name: "watchlist", ean });
    case "product-to-list":
      return () => openModalUrl({ name: "add-to-list", ean });
  }
}

function staticHoldAction(
  kind: StaticHoldKind,
  openScanner: () => void,
): () => void {
  switch (kind) {
    case "scan":
      return openScanner;
    case "store-preferences":
      return () => openModalUrl({ name: "settings", tab: "preference" });
    case "new-list":
      return () => openModalUrl({ name: "shopping-list", action: "new" });
    case "new-card":
      return () => openModalUrl({ name: "digital-card", action: "new" });
  }
}

/**
 * The one answer to both "what does this hold do" and "does this cell have a
 * hold at all", so the firing path and the enablement check cannot disagree.
 */
export default function resolveHoldTarget(
  cell: IBottomNavCell,
  { productEan, openScanner }: IHoldContext,
): (() => void) | null {
  if (productEan && cell.productHold)
    return productHoldAction(cell.productHold, productEan);

  if (cell.holdDisabled || !cell.hold) return null;

  return staticHoldAction(cell.hold, openScanner);
}
