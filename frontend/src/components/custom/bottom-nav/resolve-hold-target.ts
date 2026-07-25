import type {
  BottomNavHoldTarget,
  IBottomNavCell,
} from "@/components/custom/bottom-nav/bottom-nav-cells";

export interface IHoldContext {
  /** The ean when on a single product's page, else null */
  productEan: string | null;
  isLocked: boolean;
}

/**
 * The one answer to both "what does this hold do" and "does this cell have a hold
 * at all", so the two can never disagree. Two cells change meaning on a product's
 * page, and each declares that target itself rather than the resolver knowing.
 */
export default function resolveHoldTarget(
  cell: IBottomNavCell,
  { productEan, isLocked }: IHoldContext,
): BottomNavHoldTarget | null {
  // A locked cell answers no hold, whatever target it declares.
  if (isLocked) return null;

  if (productEan && cell.productHold) return cell.productHold;

  return cell.hold ?? null;
}
