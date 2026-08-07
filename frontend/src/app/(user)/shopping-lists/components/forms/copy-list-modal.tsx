"use client";

import { Copy, ListChecks, Share2, ShoppingBasket } from "lucide-react";

import { ModalShell } from "@/components/custom/modal/modal-shell";
import { Form } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { LOADING_LABELS } from "@/constants/loading-labels";
import { closeModalUrl } from "@/lib/modal/modal-navigation";
import { useCopyListModal } from "@/app/(user)/shopping-lists/hooks/use-copy-list-modal";
import CopyOptionRow from "@/app/(user)/shopping-lists/components/forms/copy-option-row";
import ShoppingListTitleField from "@/app/(user)/shopping-lists/components/forms/shopping-list-title-field";

interface ICopyListModalProps {
  open: boolean;
  id: string;
}

/** What to carry into the copy. Everything is optional, including the products. */
export default function CopyListModal({ open, id }: ICopyListModalProps) {
  const {
    shoppingList,
    isLoading,
    isError,
    form,
    isValid,
    options,
    setOption,
    canCopySharing,
    isCopying,
    copyList,
  } = useCopyListModal(id);

  return (
    <ModalShell
      open={open}
      onOpenChange={(isOpen) => !isOpen && closeModalUrl()}
      title="Kopiraj popis"
      description="Odaberi što se prenosi u kopiju."
      size="sm"
      preventClose={isCopying}
      formId="copy-list-form"
      submitLabel={isCopying ? LOADING_LABELS.copying : "Kopiraj"}
      submitIcon={Copy}
      submitLoading={isCopying}
      submitDisabled={isLoading || isError || !shoppingList || !isValid}
      cancelLabel="Odustani"
    >
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : isError || !shoppingList ? (
        <p className="text-sm text-muted-foreground">
          Popis nije pronađen. Možda je obrisan ili nemaš pristup.
        </p>
      ) : (
        <Form {...form}>
          <form
            id="copy-list-form"
            onSubmit={form.handleSubmit((data) => void copyList(data))}
            className="space-y-4"
          >
            {/* No autofocus: the field mounts only once the list query settles, so
                focusing it would land mid-announcement and, on mobile, open the
                keyboard over the options this modal is actually about. */}
            <ShoppingListTitleField control={form.control} autoFocus={false} />

            <CopyOptionRow
              icon={ShoppingBasket}
              label="Proizvodi"
              description="Kopiraj sve proizvode"
              checked={options.items}
              onCheckedChange={(next) => setOption("items", next)}
            />

            <CopyOptionRow
              icon={ListChecks}
              label="Označeno i spremljene trgovine"
              description="Zadrži što je kupljeno, u kojoj trgovini i po kojoj cijeni."
              // Coerced, not just disabled: a box that stays ticked while inert states a
              // choice the copy will not honour.
              checked={options.progress && options.items}
              disabled={!options.items}
              onCheckedChange={(next) => setOption("progress", next)}
            />

            <CopyOptionRow
              icon={Share2}
              label="Postavke dijeljenja"
              description={
                canCopySharing
                  ? "Kopija se dijeli jednako kao i original."
                  : "Samo vlasnik popisa može prenijeti dijeljenje."
              }
              checked={options.sharing && canCopySharing}
              disabled={!canCopySharing}
              onCheckedChange={(next) => setOption("sharing", next)}
            />
          </form>
        </Form>
      )}
    </ModalShell>
  );
}
