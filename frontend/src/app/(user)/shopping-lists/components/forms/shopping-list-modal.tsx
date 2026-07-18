"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";

import { ModalShell } from "@/components/ui/modal-shell";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DraftRestoredChip } from "@/components/custom/modal-router/draft-restored-chip";
import type { ShoppingListDto, ShoppingListRequest } from "@/lib/api/types";
import { shoppingListRequestSchema } from "@/lib/api/types";
import { shoppingListService } from "@/lib/api";
import { applyProblemToForm } from "@/lib/api/problem-details";
import { closeModalUrl } from "@/lib/modal/modal-navigation";
import { takeModalError } from "@/lib/modal/modal-error-bus";
import { useFormDraft } from "@/hooks/use-form-draft";
import { useShoppingListModal } from "@/app/(user)/shopping-lists/hooks/use-shopping-list-modal";

interface ShoppingListModalProps {
  open: boolean;
  action: "new" | "edit";
  id?: string;
}

export default function ShoppingListModal({
  open,
  action,
  id,
}: ShoppingListModalProps) {
  const queryClient = useQueryClient();
  const isEdit = action === "edit" && !!id;

  // Cache-first: the lists page almost always has the list already; the by-id
  // query only fires on cold deep links.
  const cachedList = queryClient
    .getQueryData<ShoppingListDto[]>(["shoppingLists", "me"])
    ?.find((list) => list.id === id);
  const byIdQuery = shoppingListService.useGetShoppingListById(
    isEdit && !cachedList ? (id as string) : ""
  );
  const shoppingList = isEdit ? (cachedList ?? byIdQuery.data ?? null) : null;

  const draftKey = isEdit ? `shopping-list.edit.${id}` : "shopping-list.new";
  const isReady = !isEdit || !!shoppingList;

  const form = useForm<ShoppingListRequest>({
    resolver: zodResolver(shoppingListRequestSchema),
    defaultValues: { title: "", isPublic: false },
  });

  useEffect(() => {
    if (!shoppingList) return;
    form.reset({
      title: shoppingList.title,
      isPublic: shoppingList.isPublic ?? false,
    });
  }, [shoppingList, form]);

  const { restored, clearDraft, flushDraft } = useFormDraft({
    draftKey,
    form,
    enabled: open && isReady,
  });

  // A failed optimistic save reopened this modal: surface the server error.
  useEffect(() => {
    if (!open) return;
    const error = takeModalError(draftKey);
    if (error) applyProblemToForm(error, form.setError);
  }, [open, draftKey, form]);

  const { onSubmit, isLoading } = useShoppingListModal({
    shoppingList,
    draftKey,
  });

  function handleSubmit(data: ShoppingListRequest) {
    flushDraft();
    onSubmit(data);
  }

  function handleReset() {
    clearDraft();
    form.reset();
  }

  const notFound = isEdit && !shoppingList && byIdQuery.isError;

  return (
    <ModalShell
      open={open}
      onOpenChange={(isOpen) => !isOpen && closeModalUrl()}
      title={isEdit ? "Uredi popis za kupnju" : "Novi popis za kupnju"}
      description="Popis možeš dijeliti i uspoređivati cijene po trgovinama."
      srOnlyDescription
      formId="shopping-list-form"
      submitLabel={isEdit ? "Ažuriraj" : "Stvori"}
      submitLoading={isLoading}
      submitDisabled={!form.formState.isDirty || notFound}
      cancelLabel="Odustani"
      footerStart={restored ? <DraftRestoredChip /> : undefined}
    >
      {notFound ? (
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

            {restored && (
              <button
                type="button"
                onClick={handleReset}
                className="cursor-pointer text-xs text-muted-foreground underline hover:text-primary"
              >
                Odbaci izmjene i vrati spremljene vrijednosti
              </button>
            )}
          </form>
        </Form>
      )}
    </ModalShell>
  );
}
