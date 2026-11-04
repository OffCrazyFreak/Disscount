import { useEffect, useEffectEvent } from "react";
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
    // No linkAccess: the backend treats an absent one on PUT as "leave it alone", so renaming cannot silently unshare the list.
    defaultValues: { title: "" },
  });

  // Destructured, never read inline: formState is a Proxy that subscribes on first read, and a || could short-circuit it, leaving the button a keystroke late.
  const { isDirty, isValid, errors } = form.formState;

  // Draft wins over the loaded list so an in-progress edit survives; an Effect Event so the first keystroke never reruns the seed.
  const seedForm = useEffectEvent((loaded: ShoppingListDto, key: string) => {
    if (isDirty) return;

    const base = {
      title: loaded.title,
    };
    form.reset(base);

    const draft = getFormDraft(key)?.values as
      Partial<ShoppingListRequest> | undefined;
    if (draft && Object.keys(draft).length > 0) {
      form.reset({ ...base, ...draft }, { keepDefaultValues: true });
    }
  });

  useEffect(() => {
    if (shoppingList) seedForm(shoppingList, draftKey);
  }, [shoppingList, draftKey]);

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
