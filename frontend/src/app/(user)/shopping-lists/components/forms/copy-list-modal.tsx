"use client";

import { Copy, ListChecks, Share2, ShoppingBasket } from "lucide-react";

import { ModalShell } from "@/components/custom/modal/modal-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { LOADING_LABELS } from "@/constants/loading-labels";
import { closeModalUrl } from "@/lib/modal/modal-navigation";
import { useCopyListModal } from "@/app/(user)/shopping-lists/hooks/use-copy-list-modal";
import CopyOptionRow from "@/app/(user)/shopping-lists/components/forms/copy-option-row";

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
      submitLabel={isCopying ? LOADING_LABELS.copying : "Kopiraj"}
      submitIcon={Copy}
      submitLoading={isCopying}
      submitDisabled={isLoading || isError || !shoppingList}
      onSubmit={() => void copyList()}
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
        <div className="space-y-4">
          <CopyOptionRow
            icon={ShoppingBasket}
            label="Proizvodi"
            description="Prenesi sve proizvode s popisa."
            checked={options.items}
            onCheckedChange={(next) => setOption("items", next)}
          />

          <CopyOptionRow
            icon={ListChecks}
            label="Označeno i spremljene cijene"
            description="Zadrži što je kupljeno, u kojoj trgovini i po kojoj cijeni."
            checked={options.progress}
            // Nothing to carry without the products it belongs to.
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

          {!options.items && (
            <p className="text-xs text-muted-foreground">
              Kopirat će se samo naziv popisa.
            </p>
          )}
        </div>
      )}
    </ModalShell>
  );
}
