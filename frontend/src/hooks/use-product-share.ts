"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { ProductResponse } from "@/lib/cijene-api/schemas";
import { productPageUrl } from "@/utils/product-links";
import { shareOrCopy } from "@/utils/browser/share";

/**
 * The OS share sheet where there is one, the clipboard where there is not, with
 * the same wording either way. Shared so the product page and the quick-actions
 * sheet cannot drift on what "shared" means.
 */
export default function useProductShare(product: ProductResponse) {
  const t = useTranslations("ui");

  async function share() {
    const outcome = await shareOrCopy({
      title: product.name ?? product.ean,
      url: productPageUrl(product.ean),
    });

    if (outcome === "copied") toast.success(t("share.copied"));
    if (outcome === "failed") toast.error(t("share.failed"));
  }

  return share;
}
