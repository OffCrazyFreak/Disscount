"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { DirectoryStoreDto } from "@/lib/api/schemas";
import { toStoreKey } from "@/app/[locale]/map/utils/store-key";
import { shareOrCopy } from "@/utils/browser/share";
import { getChainLabel, getLocationLabel } from "@/utils/labels";

interface IShareStoreButtonProps {
  store: DirectoryStoreDto;
}

/**
 * Sits in the open row's address line, above the toggle that covers the row, so
 * it lifts itself over that toggle and widens its tap area past its small size.
 */
export default function ShareStoreButton({ store }: IShareStoreButtonProps) {
  const t = useTranslations("map.actions");

  async function share() {
    // The current path keeps the language prefix (/en/map) in the shared link.
    const url = new URL(window.location.pathname, window.location.origin);
    url.searchParams.set("store", toStoreKey(store.chain, store.code));

    const outcome = await shareOrCopy({
      title: `${getChainLabel(store.chain)}, ${getLocationLabel(store.city)}`,
      text: store.address ?? undefined,
      url: url.toString(),
    });

    if (outcome === "copied") toast.success(t("copied"));
    if (outcome === "failed") toast.error(t("shareFailed"));
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={share}
      className="relative z-10 ml-1.5 h-6 after:absolute after:-inset-2 gap-1 rounded-full px-2 align-middle text-xs [&_svg:not([class*='size-'])]:size-3"
    >
      <Share2 aria-hidden="true" />
      {t("share")}
    </Button>
  );
}
