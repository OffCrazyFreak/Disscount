"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { shoppingListService } from "@/lib/api";
import type { ShoppingListRequest } from "@/lib/api/types";
import { shoppingListRequestSchema } from "@/lib/api/types";
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

const COPY_SUFFIX = " (Kopija)";
// Read off the schema rather than restated, so raising the limit in one place cannot
// leave the prefill producing titles the same schema then rejects.
const TITLE_MAX_LENGTH = shoppingListRequestSchema.shape.title.maxLength ?? 100;

/**
 * The name the copy starts with. The original is shortened so the suffix always fits:
 * a prefill that lands over the limit would open the modal on a validation error the
 * user did not cause.
 *
 * Taken a code point at a time so the cut cannot split an emoji in half, but budgeted in
 * UTF-16 units, because that is what zod's max() counts: slicing to 91 code points would
 * leave an emoji title twice that long by the schema's reckoning.
 */
function suggestCopyTitle(title: string) {
  const room = TITLE_MAX_LENGTH - COPY_SUFFIX.length;

  let head = "";
  for (const character of title) {
    if (head.length + character.length > room) break;
    head += character;
  }

  return `${head}${COPY_SUFFIX}`;
}

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

  // No draft persistence, unlike the create and edit modals: the default comes from
  // server data the user has not asked to keep, so a stale draft would fight the prefill.
  const form = useForm<ShoppingListRequest>({
    resolver: zodResolver(shoppingListRequestSchema),
    mode: "onChange",
    defaultValues: { title: "" },
  });

  const { isDirty } = form.formState;
  // useWatch, not form.watch: watch() is a function the React Compiler cannot memoize,
  // so reading it here would opt the whole hook out of compilation.
  const title = useWatch({ control: form.control, name: "title" });

  // Parsed rather than read off formState.isValid, the same way the watchlist form does
  // it: the flag only refreshes when the resolver runs, and the seeding reset below does
  // not run it, so an untouched valid prefill would read as invalid and leave Kopiraj
  // dead until the user typed. The resolver still owns the message under the field.
  const isValid = shoppingListRequestSchema.safeParse({ title }).success;

  // Seeds the suggested name once the list lands, and never again after the first
  // keystroke, so a late refetch cannot overwrite what the user typed.
  useEffect(() => {
    if (!shoppingList || isDirty) return;

    form.reset({ title: suggestCopyTitle(shoppingList.title) });
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
    form,
    isValid,
    options,
    setOption,
    canCopySharing,
    isCopying: copyMutation.isPending,
    copyList,
  };
}
