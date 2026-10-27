"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { useUser } from "@/context/user-context";
import {
  MAX_FAVORITE_STORES,
  useFavoriteStoresQuery,
  useSaveFavoriteStores,
} from "@/lib/api/favorite-stores/hooks";
import { openModalUrl } from "@/lib/modal/modal-navigation";

/** The signed-in user's favourite stores, and a toggle that asks a guest to sign in. */
export function useFavoriteStores() {
  const t = useTranslations("map.favorites");
  const { isAuthenticated } = useUser();
  const query = useFavoriteStoresQuery({ enabled: isAuthenticated });
  const save = useSaveFavoriteStores();

  const keys = isAuthenticated
    ? (query.data ?? []).map((favorite) => favorite.storeKey)
    : [];

  function toggle(storeKey: string) {
    if (!isAuthenticated) {
      openModalUrl({ name: "login" });
      return;
    }

    // Every save replaces the whole list, so one built before the saved list
    // arrived would erase it.
    if (!query.isSuccess) {
      toast.error(t("saveFailed"));
      return;
    }

    if (keys.includes(storeKey)) {
      save.mutate(
        keys.filter((key) => key !== storeKey),
        {
          onError: () => toast.error(t("saveFailed")),
        },
      );
      return;
    }

    if (keys.length >= MAX_FAVORITE_STORES) {
      toast.error(t("limit", { max: MAX_FAVORITE_STORES }));
      return;
    }

    save.mutate([...keys, storeKey], {
      onError: () => toast.error(t("saveFailed")),
    });
  }

  return { keys, isFavorite: (key: string) => keys.includes(key), toggle };
}
