"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { shoppingListService } from "@/lib/api";
import { shoppingListPath } from "@/utils/shopping-list-links";
import { resolveShoppingListAccess } from "@/app/(user)/shopping-lists/utils/shopping-list-access";

export interface ICopyListOptions {
  items: boolean;
  progress: boolean;
  sharing: boolean;
}

/**
 * What a copy carries. Products are on because a copy without them is just a title;
 * everything else is off, since the common reason to copy is "same shop, next week" and
 * last week's ticks and prices would make the copy wrong on arrival.
 */
const DEFAULT_OPTIONS: ICopyListOptions = {
  items: true,
  progress: false,
  sharing: false,
};

export function useCopyListModal(id: string) {
  const router = useRouter();
  const [options, setOptions] = useState<ICopyListOptions>(DEFAULT_OPTIONS);

  const listQuery = shoppingListService.useGetShoppingListById(id);
  const copyMutation = shoppingListService.useCopyShoppingList();
  const shoppingList = listQuery.data ?? null;

  // Server-enforced too; this keeps the control honest about it.
  const canCopySharing = resolveShoppingListAccess(
    shoppingList?.myAccess,
  ).canManageShare;

  function setOption(key: keyof ICopyListOptions, value: boolean) {
    setOptions((previous) => ({ ...previous, [key]: value }));
  }

  async function copyList() {
    if (!shoppingList || copyMutation.isPending) return;

    try {
      const copy = await copyMutation.mutateAsync({
        id,
        data: {
          title: `${shoppingList.title} (Kopija)`,
          includeItems: options.items,
          includeProgress: options.progress && options.items,
          includeSharing: options.sharing && canCopySharing,
        },
      });

      // replace, not close-then-push: closeModalUrl pops asynchronously and would undo it.
      toast.success("Popis za kupnju je uspješno kopiran!");
      router.replace(shoppingListPath(copy.id));
    } catch {
      toast.error("Greška pri kopiranju popisa za kupnju");
    }
  }

  return {
    shoppingList,
    isLoading: listQuery.isLoading,
    isError: listQuery.isError,
    options,
    setOption,
    canCopySharing,
    isCopying: copyMutation.isPending,
    copyList,
  };
}
