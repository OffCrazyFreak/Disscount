"use client";

import dynamic from "next/dynamic";

import useLingeringTarget from "@/components/custom/modal-router/use-lingering-target";
import type { ModalTarget } from "@/lib/modal/modal-registry";

const ProductActionsSheet = dynamic(
  () => import("@/app/products/components/forms/product-actions-sheet"),
  { ssr: false },
);

interface IProductActionsOutletProps {
  target: ModalTarget | null;
}

/**
 * Mounted outside the router's signed-in branch, because a shared link to a
 * product's actions must open for anyone. The two actions that need an account
 * raise the auth gate themselves when they are picked.
 */
export default function ProductActionsOutlet({
  target,
}: IProductActionsOutletProps) {
  const active = target?.name === "product-actions" ? target : null;
  const rendered = useLingeringTarget(active);

  if (!rendered) return null;

  return <ProductActionsSheet open={!!active} ean={rendered.ean} />;
}
