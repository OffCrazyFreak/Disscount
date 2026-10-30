"use client";

import { usePathname } from "@/i18n/navigation";
import { Suspense } from "react";
import { useTranslations } from "next-intl";

import { ListChecks } from "lucide-react";
import SearchBar from "@/components/custom/search/search-bar";
import SearchBarSkeleton from "@/components/custom/search/search-bar-skeleton";
import ShoppingListsResults from "@/app/[locale]/(user)/shopping-lists/components/shopping-lists-results";
import CreateShoppingListButton from "@/app/[locale]/(user)/shopping-lists/components/create-shopping-list-button";
import LoginRequired from "@/components/custom/common/login-required";
import { filterByFields } from "@/utils/generic";
import { shoppingListService } from "@/lib/api";
import { useUser } from "@/context/user-context";
import { openModalUrl } from "@/lib/modal/modal-navigation";
import { sortShoppingListsByRecency } from "@/lib/api/shopping-lists/sort-lists";

interface IShoppingListsClientProps {
  query: string;
}

export default function ShoppingListsClient({
  query,
}: IShoppingListsClientProps) {
  const t = useTranslations("shoppingLists");
  const pathname = usePathname();

  const { isAuthenticated, isLoading: userLoading } = useUser();
  const { data: shoppingLists = [], isLoading } =
    shoppingListService.useGetCurrentUserShoppingLists({
      enabled: isAuthenticated,
    });

  const isUserLoading = userLoading || isLoading;

  // Most recently touched first. The API returns these in no defined order, so
  // without this the list can silently reshuffle between fetches. filterByFields
  // sorts stably on coarse scores, so this order survives among equal matches.
  const matchingShoppingLists = filterByFields(
    sortShoppingListsByRecency(shoppingLists),
    query,
    ["title"],
  );

  if (!userLoading && !isAuthenticated) {
    return (
      <LoginRequired
        title={t("client.loginTitle")}
        description={t("client.loginDescription")}
        icon={<ListChecks className="size-12 text-primary" />}
      />
    );
  }

  return (
    <>
      <div className="space-y-4">
        <Suspense fallback={<SearchBarSkeleton submitButtonLocation="none" />}>
          <SearchBar
            placeholder={t("client.searchPlaceholder")}
            searchRoute={pathname}
            clearable={true}
            submitButtonLocation="none"
            autoSearch={true}
            disabled={!isUserLoading && shoppingLists.length === 0}
          />
        </Suspense>

        <div className="flex items-center justify-between gap-4">
          <h3>
            {query.length > 0
              ? t("client.searchResults", {
                  query,
                  count: matchingShoppingLists.length,
                })
              : isUserLoading
                ? t("client.myLists")
                : t("client.myListsWithCount", {
                    count: matchingShoppingLists.length,
                  })}
          </h3>

          <CreateShoppingListButton
            onCreateClick={() =>
              openModalUrl({ name: "shopping-list", action: "new" })
            }
          />
        </div>

        <ShoppingListsResults
          isLoading={isUserLoading}
          shoppingLists={matchingShoppingLists}
          query={query}
        />
      </div>
    </>
  );
}
