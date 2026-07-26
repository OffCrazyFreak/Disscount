"use client";

import dynamic from "next/dynamic";

import useLingeringTarget, {
  SHEET_EXIT_MS,
} from "@/components/custom/modal-router/use-lingering-target";
import type { ModalTarget } from "@/lib/modal/modal-registry";

const ProductActionsSheet = dynamic(
  () => import("@/app/products/components/forms/product-actions-sheet"),
  { ssr: false },
);

interface IProductActionsOutletProps {
  target: ModalTarget | null;
}

/**
 * Mounted outside the router's signed-in branch, since a shared link must open
 * for anyone; the two gated actions raise the auth gate when they are picked.
 */
export default function ProductActionsOutlet({
  target,
}: IProductActionsOutletProps) {
  const active = target?.name === "product-actions" ? target : null;
  const rendered = useLingeringTarget(active, SHEET_EXIT_MS);

  if (!rendered) return null;

  return <ProductActionsSheet open={!!active} ean={rendered.ean} />;
}
