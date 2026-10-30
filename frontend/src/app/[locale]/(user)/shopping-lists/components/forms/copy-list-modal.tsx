"use client";

import { Copy, ListChecks, Share2, ShoppingBasket } from "lucide-react";
import { useTranslations } from "next-intl";

import { ModalShell } from "@/components/custom/modal/modal-shell";
import { Form } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { LOADING_LABELS } from "@/constants/loading-labels";
import { closeModalUrl } from "@/lib/modal/modal-navigation";
import { useCopyListModal } from "@/app/[locale]/(user)/shopping-lists/hooks/use-copy-list-modal";
import CopyOptionRow from "@/app/[locale]/(user)/shopping-lists/components/forms/copy-option-row";
import ShoppingListTitleField from "@/app/[locale]/(user)/shopping-lists/components/forms/shopping-list-title-field";

interface ICopyListModalProps {
  open: boolean;
  id: string;
}

/** What to carry into the copy. Everything is optional, including the products. */
export default function CopyListModal({ open, id }: ICopyListModalProps) {
  const t = useTranslations("shoppingLists");
  const tShell = useTranslations("shell");
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
      title={t("copyModal.title")}
      description={t("copyModal.description")}
      size="sm"
      preventClose={isCopying}
      formId="copy-list-form"
      submitLabel={
        isCopying ? tShell(LOADING_LABELS.copying) : t("copyModal.submit")
      }
      submitIcon={Copy}
      submitLoading={isCopying}
      submitDisabled={isLoading || isError || !shoppingList || !isValid}
      cancelLabel={t("modal.cancel")}
    >
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : isError || !shoppingList ? (
        <p className="text-sm text-muted-foreground">{t("modal.notFound")}</p>
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
              label={t("copyModal.options.items.label")}
              description={t("copyModal.options.items.description")}
              checked={options.items}
              onCheckedChange={(next) => setOption("items", next)}
            />

            <CopyOptionRow
              icon={ListChecks}
              label={t("copyModal.options.progress.label")}
              description={t("copyModal.options.progress.description")}
              // Coerced, not just disabled: a box that stays ticked while inert states a
              // choice the copy will not honour.
              checked={options.progress && options.items}
              disabled={!options.items}
              onCheckedChange={(next) => setOption("progress", next)}
            />

            <CopyOptionRow
              icon={Share2}
              label={t("copyModal.options.sharing.label")}
              description={
                canCopySharing
                  ? t("copyModal.options.sharing.descriptionOwner")
                  : t("copyModal.options.sharing.descriptionNotOwner")
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
