"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, LogIn, Lock } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Banner } from "@/components/custom/common/banner";
import BlockLoadingSpinner from "@/components/custom/common/block-loading-spinner";
import NoResults from "@/components/custom/common/no-results";
import LastSyncedLabel from "@/components/custom/offline/last-synced-label";
import { openModalUrl } from "@/lib/modal/modal-navigation";
import { useUser } from "@/context/user-context";
import ShoppingListHeader from "@/app/(user)/shopping-lists/[id]/components/shopping-list-header";
import ShoppingListInfoTable from "@/app/(user)/shopping-lists/[id]/components/shopping-list-info-table";
import ShoppingListItems from "@/app/(user)/shopping-lists/[id]/components/items/shopping-list-items";
import ShoppingListPriceHistory from "@/app/(user)/shopping-lists/[id]/components/shopping-list-price-history";
import ShoppingListStoreSummary from "@/app/(user)/shopping-lists/[id]/components/stores/shopping-list-stores-list";
import { useShoppingListData } from "@/app/(user)/shopping-lists/[id]/hooks/use-shopping-list-data";

interface ISharedShoppingListClientProps {
  token: string;
}

export default function SharedShoppingListClient({
  token,
}: ISharedShoppingListClientProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading: isUserLoading } = useUser();

  const {
    shoppingList,
    isLoading,
    error,
    listUpdatedAt,
    cheapestStores,
    averagePrices,
    storePrices,
    isPricesLoading,
  } = useShoppingListData("", token);

  // The owner following their own link belongs on the real list, where sharing, editing
  // and deleting live. Replace rather than push, so Back does not bounce them here again.
  const isOwner = shoppingList?.myAccess === "OWNER";
  useEffect(() => {
    if (isOwner && shoppingList) {
      router.replace(`/shopping-lists/${shoppingList.id}`);
    }
  }, [isOwner, shoppingList, router]);

  if (isLoading || isOwner) {
    return (
      <div className="grid place-items-center">
        <BlockLoadingSpinner size={96} />
      </div>
    );
  }

  // A dead token and a token that never existed are the same 404 on purpose, so the
  // wording cannot be used to confirm that a list is there.
  if (error || !shoppingList) {
    return (
      <div className="mx-auto">
        <NoResults
          icon={<Lock className="size-12 text-gray-400 mx-auto mb-4" />}
          title="Poveznica više ne vrijedi"
          description="Vlasnik je prestao dijeliti ovaj popis ili je poveznica netočna."
        />

        <div className="text-center">
          <Button asChild variant="ghost">
            <Link href="/products">
              <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
              Istraži proizvode
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {!isUserLoading && !isAuthenticated && (
        <Banner variant="primarySoft" size="md" icon={LogIn}>
          <p className="text-xs text-primary/90">
            Prijavi se za uređivanje ovog popisa.
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-1 h-7 px-2"
            onClick={() => openModalUrl({ name: "login" })}
          >
            Prijava
          </Button>
        </Banner>
      )}

      <section>
        <ShoppingListHeader
          shoppingList={shoppingList}
          isSignedIn={isAuthenticated}
        />

        {listUpdatedAt > 0 && (
          <LastSyncedLabel
            updatedAt={listUpdatedAt}
            prefix="Popis osvježen"
            className="mt-1 block"
          />
        )}
      </section>

      <section>
        <ShoppingListInfoTable
          shoppingList={shoppingList}
          averagePrices={averagePrices}
          isPricesLoading={isPricesLoading}
        />
      </section>

      <section>
        <ShoppingListItems
          shoppingList={shoppingList}
          cheapestStores={cheapestStores}
          averagePrices={averagePrices}
          storePrices={storePrices}
          shareToken={token}
        />
      </section>

      <section>
        <ShoppingListPriceHistory shoppingList={shoppingList} />
      </section>

      <section>
        <ShoppingListStoreSummary shoppingList={shoppingList} />
      </section>
    </div>
  );
}
