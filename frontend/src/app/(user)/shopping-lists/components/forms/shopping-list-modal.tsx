"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";

import { ModalShell } from "@/components/ui/modal-shell";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { ShoppingListDto, ShoppingListRequest } from "@/lib/api/types";
import { shoppingListRequestSchema } from "@/lib/api/types";
import { shoppingListService } from "@/lib/api";
import { applyProblemToForm } from "@/lib/api/problem-details";
import { closeModalUrl } from "@/lib/modal/modal-navigation";
import { takeModalError } from "@/lib/modal/modal-error-bus";
import { useFormDraft } from "@/hooks/use-form-draft";
import { getFormDraft } from "@/utils/browser/local-storage";
import { useShoppingListModal } from "@/app/(user)/shopping-lists/hooks/use-shopping-list-modal";

interface IShoppingListModalProps {
  open: boolean;
  action: "new" | "edit";
  id?: string;
}

export default function ShoppingListModal({
  open,
  action,
  id,
}: IShoppingListModalProps) {
  const queryClient = useQueryClient();
  const isEdit = action === "edit" && !!id;

  // The by-id query is reactive and always the freshest source (it refetches
  // after an edit invalidates ["shoppingLists"]). The index cache only seeds an
  // instant value while that query settles, so a just-saved title never shows stale.
  const cachedList = queryClient
    .getQueryData<ShoppingListDto[]>(["shoppingLists", "me"])
    ?.find((list) => list.id === id);
  const byIdQuery = shoppingListService.useGetShoppingListById(
    isEdit ? (id as string) : "",
  );
  const shoppingList = isEdit ? (byIdQuery.data ?? cachedList ?? null) : null;

  const draftKey = isEdit ? `shopping-list.edit.${id}` : "shopping-list.new";
  const isReady = !isEdit || !!shoppingList;

  const form = useForm<ShoppingListRequest>({
    resolver: zodResolver(shoppingListRequestSchema),
    mode: "onChange",
    defaultValues: { title: "", isPublic: false },
  });

  // Populate from the loaded list, then merge any saved draft on top (draft
  // wins and shows as unsaved). Never clobbers values the user is editing.
  useEffect(() => {
    if (!shoppingList || form.formState.isDirty) return;

    const base = {
      title: shoppingList.title,
      isPublic: shoppingList.isPublic ?? false,
    };
    form.reset(base);

    const draft = getFormDraft(draftKey)?.values as
      Partial<ShoppingListRequest> | undefined;
    if (draft && Object.keys(draft).length > 0) {
      form.reset({ ...base, ...draft }, { keepDefaultValues: true });
    }
  }, [shoppingList, draftKey, form]);

  const { restored, clearDraft, flushDraft } = useFormDraft({
    draftKey,
    form,
    enabled: open && isReady,
    // New lists auto-restore via the engine; edit modals merge the draft themselves below.
    restore: !isEdit,
  });

  // A failed optimistic save reopened this modal: surface the server error.
  useEffect(() => {
    if (!open) return;
    const error = takeModalError(draftKey);
    if (error) applyProblemToForm(error, form);
  }, [open, draftKey, form]);

  const { onSubmit, isLoading } = useShoppingListModal({
    shoppingList,
    draftKey,
  });

  function handleSubmit(data: ShoppingListRequest) {
    flushDraft();
    onSubmit(data);
  }

  const loading = isEdit && !shoppingList && byIdQuery.isLoading;
  const notFound = isEdit && !shoppingList && !byIdQuery.isLoading;

  return (
    <ModalShell
      open={open}
      onOpenChange={(isOpen) => !isOpen && closeModalUrl()}
      title={isEdit ? "Uredi popis za kupnju" : "Novi popis za kupnju"}
      description="Popis možeš dijeliti i uspoređivati cijene po trgovinama."
      srOnlyDescription
      dirty={form.formState.isDirty}
      formId="shopping-list-form"
      submitLabel={isEdit ? "Spremi" : "Stvori"}
      submitIcon={Save}
      submitLoading={isLoading}
      submitDisabled={
        !form.formState.isDirty || !form.formState.isValid || notFound
      }
      cancelLabel="Odustani"
      resetLabel="Resetiraj"
      resetDisabled={!form.formState.isDirty && !restored}
      onReset={() => {
        clearDraft();
        form.reset();
      }}
    >
      {loading ? (
        <Skeleton className="h-10 w-full" />
      ) : notFound ? (
        <p className="text-sm text-muted-foreground">
          Popis nije pronađen. Možda je obrisan ili nemaš pristup.
        </p>
      ) : (
        <Form {...form}>
          <form
            id="shopping-list-form"
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            {form.formState.errors.root && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                {form.formState.errors.root.message}
              </div>
            )}

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Naziv popisa</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Roštilj 01.05.2026."
                      autoFocus
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      )}
    </ModalShell>
  );
}
