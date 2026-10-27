"use client";

import { Star } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { useFavoriteStores } from "@/app/[locale]/map/hooks/use-favorite-stores";
import { cn } from "@/lib/utils";

interface IFavoriteStoreButtonProps {
  storeKey: string;
}

/** Beside the share pill, and lifted over the row's toggle the same way. */
export default function FavoriteStoreButton({
  storeKey,
}: IFavoriteStoreButtonProps) {
  const t = useTranslations("map.favorites");
  const { isFavorite, toggle } = useFavoriteStores();
  const isOn = isFavorite(storeKey);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      aria-pressed={isOn}
      aria-label={isOn ? t("remove") : t("add")}
      title={isOn ? t("remove") : t("add")}
      onClick={() => toggle(storeKey)}
      className="relative z-10 ml-1.5 size-6 rounded-full p-0 align-middle after:absolute after:-inset-2 [&_svg:not([class*='size-'])]:size-3.5"
    >
      <Star
        aria-hidden="true"
        className={cn(isOn && "fill-amber-400 text-amber-500")}
      />
    </Button>
  );
}
