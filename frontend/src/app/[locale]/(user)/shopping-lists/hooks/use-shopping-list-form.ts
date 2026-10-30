import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import type { ShoppingListDto, ShoppingListRequest } from "@/lib/api/types";
import { shoppingListRequestSchema } from "@/lib/api/types";
import { useFormDraft } from "@/hooks/use-form-draft";
import { useModalError } from "@/hooks/use-modal-error";
import { getFormDraft } from "@/utils/browser/local-storage";

interface IUseShoppingListFormProps {
  open: boolean;
  isEdit: boolean;
  id?: string;
  shoppingList: ShoppingListDto | null;
}

export function useShoppingListForm({
  open,
  isEdit,
  id,
  shoppingList,
}: IUseShoppingListFormProps) {
  const draftKey = isEdit ? `shopping-list.edit.${id}` : "shopping-list.new";
  const isReady = !isEdit || !!shoppingList;

  const form = useForm<ShoppingListRequest>({
    resolver: zodResolver(shoppingListRequestSchema),
    mode: "onChange",
    // No linkAccess here on purpose: sharing lives in its own modal, and the backend
    // treats an absent linkAccess on PUT as "leave it alone", so renaming a shared list
    // from here cannot silently unshare it.
    defaultValues: { title: "" },
  });

  // Destructured, never read inline: formState is a Proxy that subscribes to a
  // field the first time it is read during render. Behind a || the read gets
  // short-circuited away, so RHF never recomputes that field and the button
  // reacts a keystroke late.
  const { isDirty, isValid, errors } = form.formState;

  // Draft wins over the loaded list, so an in-progress edit is never clobbered.
  useEffect(() => {
    if (!shoppingList || isDirty) return;

    const base = {
      title: shoppingList.title,
    };
    form.reset(base);

    const draft = getFormDraft(draftKey)?.values as
      Partial<ShoppingListRequest> | undefined;
    if (draft && Object.keys(draft).length > 0) {
      form.reset({ ...base, ...draft }, { keepDefaultValues: true });
    }
    // isDirty is read on purpose but must not retrigger the seed: adding it would
    // reset the form the moment the user's first keystroke flips it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shoppingList, draftKey, form]);

  const { restored, clearDraft, flushDraft } = useFormDraft({
    draftKey,
    form,
    enabled: open && isReady,
    // New lists auto-restore via the engine; edit modals merge the draft themselves below.
    restore: !isEdit,
  });

  useModalError(open, draftKey, form);

  return {
    form,
    draftKey,
    isDirty,
    isValid,
    errors,
    restored,
    clearDraft,
    flushDraft,
  };
}
