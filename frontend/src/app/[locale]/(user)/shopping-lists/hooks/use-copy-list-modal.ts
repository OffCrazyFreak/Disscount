"use client";

import { useRouter } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { shoppingListService } from "@/lib/api";
import { isDeadListLink } from "@/lib/api/shopping-lists/is-dead-list-link";
import type { ShoppingListRequest } from "@/lib/api/types";
import { shoppingListRequestSchema } from "@/lib/api/types";
import { shoppingListPath } from "@/utils/shopping-list-links";
import { resolveShoppingListAccess } from "@/app/[locale]/(user)/shopping-lists/utils/shopping-list-access";

export interface ICopyListOptions {
  items: boolean;
  progress: boolean;
  sharing: boolean;
}

/** Products on, or a copy is just a title; the rest off, as old ticks and prices would be wrong. */
const DEFAULT_OPTIONS: ICopyListOptions = {
  items: true,
  progress: false,
  sharing: false,
};

// Read off the schema so raising the limit cannot leave the prefill producing titles the schema rejects.
const TITLE_MAX_LENGTH = shoppingListRequestSchema.shape.title.maxLength ?? 100;

/** Shortened so a prefill never opens invalid; cut by code point but budgeted in zod's UTF-16 units. */
function suggestCopyTitle(title: string, suffix: string) {
  const room = TITLE_MAX_LENGTH - suffix.length;

  let head = "";
  for (const character of title) {
    if (head.length + character.length > room) break;
    head += character;
  }

  return `${head}${suffix}`;
}

export function useCopyListModal(id: string) {
  const t = useTranslations("shoppingLists");
  const router = useRouter();
  const [options, setOptions] = useState<ICopyListOptions>(DEFAULT_OPTIONS);

  const listQuery = shoppingListService.useGetShoppingListById(id);
  const copyMutation = shoppingListService.useCopyShoppingList();
  // A failed refetch keeps the cached list; only a 404 means it is gone, as on the list page.
  const shoppingList = isDeadListLink(listQuery.error)
    ? null
    : (listQuery.data ?? null);

  // Server-enforced too; this keeps the control honest about it.
  const canCopySharing = resolveShoppingListAccess(
    shoppingList?.myAccess,
  ).canManageShare;

  // No draft: the default is server data the user did not ask to keep, and a draft would fight it.
  const form = useForm<ShoppingListRequest>({
    resolver: zodResolver(shoppingListRequestSchema),
    mode: "onChange",
    defaultValues: { title: "" },
  });

  const { isDirty } = form.formState;
  // useWatch, because watch() cannot be memoized and would opt the whole hook out of compilation.
  const title = useWatch({ control: form.control, name: "title" });

  // Parsed, because the seeding reset does not refresh formState.isValid, which would leave Kopiraj dead.
  const isValid = shoppingListRequestSchema.safeParse({ title }).success;

  // Seeds once and never after the first keystroke, so a late refetch cannot overwrite what the user typed.
  useEffect(() => {
    if (!shoppingList || isDirty) return;

    form.reset({
      title: suggestCopyTitle(shoppingList.title, t("copyModal.titleSuffix")),
    });
    // isDirty is read on purpose but must not retrigger the seed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shoppingList, form]);

  function setOption(key: keyof ICopyListOptions, value: boolean) {
    setOptions((previous) => ({ ...previous, [key]: value }));
  }

  async function copyList(data: ShoppingListRequest) {
    if (!shoppingList || copyMutation.isPending) return;

    try {
      const copy = await copyMutation.mutateAsync({
        id,
        data: {
          title: data.title,
          includeItems: options.items,
          includeProgress: options.progress && options.items,
          includeSharing: options.sharing && canCopySharing,
        },
      });

      // replace, not close-then-push: closeModalUrl pops asynchronously and would undo it.
      toast.success(t("copyModal.successToast"));
      router.replace(shoppingListPath(copy.id));
    } catch {
      toast.error(t("copyModal.errorToast"));
    }
  }

  return {
    shoppingList,
    isLoading: listQuery.isLoading,
    form,
    isValid,
    options,
    setOption,
    canCopySharing,
    isCopying: copyMutation.isPending,
    copyList,
  };
}
