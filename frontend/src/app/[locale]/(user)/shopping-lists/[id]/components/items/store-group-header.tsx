"use client";

import { MapPin } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import StoreChainLogo from "@/components/custom/store-chain/store-chain-logo";
import { Button } from "@/components/ui/button";
import { useUser } from "@/context/user-context";
import { Link } from "@/i18n/navigation";
import { useFavoriteStoresQuery } from "@/lib/api/favorite-stores/hooks";
import type { IStoreGroup } from "@/app/[locale]/(user)/shopping-lists/[id]/utils/group-items-by-store";
import { getChainLabel } from "@/utils/labels";
import { formatPrice } from "@/utils/price";

interface IStoreGroupHeaderProps {
  group: IStoreGroup;
}

/** The chain, its item count and subtotal, and the way to that store on the map. */
export default function StoreGroupHeader({ group }: IStoreGroupHeaderProps) {
  const t = useTranslations("shoppingListDetail.groups");
  const locale = useLocale();
  const { isAuthenticated } = useUser();
  const favorites = useFavoriteStoresQuery({ enabled: isAuthenticated });
  const { chain } = group;

  // A favourite store of this chain is where the user shops; otherwise the
  // map shows every store of the chain.
  const favoriteKey = chain
    ? favorites.data?.find((f) => f.storeKey.startsWith(`${chain}:`))?.storeKey
    : undefined;
  const query = favoriteKey ? { store: favoriteKey } : { chain: chain ?? "" };

  return (
    <div className="flex items-center gap-3 px-1 pb-2">
      {chain && (
        <span
          className="relative size-8 shrink-0 overflow-hidden rounded-sm border bg-white"
          aria-hidden="true"
        >
          <StoreChainLogo
            chain={chain}
            width={32}
            height={32}
            className="object-contain"
          />
        </span>
      )}

      <div className="min-w-0 flex-1">
        <h3 className="truncate font-semibold">
          {chain ? getChainLabel(chain) : t("other")}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t("summary", {
            count: group.items.length,
            subtotal: formatPrice(group.subtotal, locale),
            partial: group.isPartial ? "yes" : "no",
          })}
        </p>
      </div>

      {chain && (
        <Button asChild variant="outline" size="sm" className="shrink-0">
          <Link href={{ pathname: "/map", query }}>
            <MapPin aria-hidden="true" />
            {t("onMap")}
          </Link>
        </Button>
      )}
    </div>
  );
}
