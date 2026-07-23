"use client";

import { useEffect } from "react";
import { Eye, Save, TriangleAlert } from "lucide-react";

import { ModalShell } from "@/components/custom/modal/modal-shell";
import { Form } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { RemoveIconButton } from "@/components/ui/remove-icon-button";
import { WatchType } from "@/lib/api";
import cijeneService from "@/lib/cijene-api";
import { closeModalUrl } from "@/lib/modal/modal-navigation";
import type { WatchTypeParam } from "@/lib/modal/modal-registry";
import ProductInfoDisplay from "@/app/products/components/product-info-display";
import { Banner } from "@/components/ui/banner";
import {
  getAveragePrice,
  getMinPrice,
} from "@/app/products/utils/product-utils";
import WatchlistTypePicker from "@/app/products/components/forms/watchlist-type-picker";
import FormRootError from "@/components/custom/common/form-root-error";
import WatchlistThresholdInput from "@/app/products/components/forms/watchlist-threshold-input";
import { useWatchlistItemForm } from "@/app/products/hooks/use-watchlist-item-form";
import { useFormDraft } from "@/hooks/use-form-draft";
import type { WatchlistItemDto } from "@/lib/api/schemas/watchlist";

interface IWatchlistItemModalProps {
  open: boolean;
  ean: string;
  watchType?: WatchTypeParam;
}

function buildAlertMessage(items: WatchlistItemDto[]): string | null {
  if (items.length === 0) return null;

  const parts: string[] = [];
  const percentageItem = items.find(
    (item) => item.watchType === WatchType.percentage,
  );
  const absoluteItem = items.find(
    (item) => item.watchType === WatchType.absolute,
  );

  if (percentageItem) {
    parts.push(`postotka od ${Math.round(percentageItem.thresholdValue)}%`);
  }
  if (absoluteItem) {
    parts.push(`popusta od ${absoluteItem.thresholdValue}€`);
  }

  return `Ovaj proizvod je već na popisu za praćenje s minimalnim pragom ${parts.join(" te ")}.`;
}

export default function WatchlistItemModal({
  open,
  ean,
  watchType,
}: IWatchlistItemModalProps) {
  const productQuery = cijeneService.useGetProductByEan({ ean });
  const product = productQuery.data;

  const avgPrice = product ? getAveragePrice(product) : 0;
  const minPrice = product ? getMinPrice(product) : 0;

  const {
    form,
    draftKey,
    existingItems,
    existingItemForType,
    isCheckingWatchlist,
    onSubmit,
    onRemove,
    isSaving,
    isRemoving,
  } = useWatchlistItemForm(
    open,
    ean,
    avgPrice,
    watchType === "absolute" ? WatchType.absolute : WatchType.percentage,
  );

  const { restored, clearDraft } = useFormDraft({
    draftKey,
    form,
    enabled: open && !isCheckingWatchlist,
  });

  // The badge that opened the modal picks the initial type via the URL; the
  // component stays mounted between opens, so sync it on change too.
  useEffect(() => {
    if (!open || !watchType) return;
    form.setValue(
      "watchType",
      watchType === "absolute" ? WatchType.absolute : WatchType.percentage,
    );
  }, [open, watchType, form]);

  const alertMessage = buildAlertMessage(existingItems);

  return (
    <ModalShell
      open={open}
      onOpenChange={(isOpen) => !isOpen && closeModalUrl()}
      title="Dodaj na popis za praćenje"
      description="Postavi prag sniženja i javit ćemo ti kad se dosegne."
      srOnlyDescription
      dirty={form.formState.isDirty}
      formId="watchlist-form"
      submitLabel={existingItemForType ? "Spremi" : "Prati"}
      submitIcon={existingItemForType ? Save : Eye}
      submitLoading={isSaving}
      submitDisabled={
        isCheckingWatchlist || !product || !form.formState.isValid
      }
      cancelLabel="Odustani"
      resetLabel="Resetiraj"
      resetDisabled={!form.formState.isDirty && !restored}
      onReset={() => {
        clearDraft();
        form.reset();
      }}
    >
      {productQuery.isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : !product ? (
        <p className="text-sm text-muted-foreground">Proizvod nije pronađen.</p>
      ) : (
        <div className="space-y-6">
          <ProductInfoDisplay
            product={product}
            enableActionButtons={false}
            action={
              existingItems.length > 0 ? (
                <RemoveIconButton
                  label="Ukloni s popisa za praćenje"
                  onClick={onRemove}
                  loading={isRemoving}
                  disabled={isCheckingWatchlist}
                />
              ) : undefined
            }
          />

          <Form {...form}>
            <form
              id="watchlist-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
            >
              <FormRootError message={form.formState.errors.root?.message} />

              <WatchlistTypePicker />

              {alertMessage && !isCheckingWatchlist && (
                <Banner
                  variant="warningSoft"
                  size="lg"
                  icon={TriangleAlert}
                  title="Proizvod već na popisu za praćenje"
                  text={alertMessage}
                />
              )}

              <WatchlistThresholdInput
                minPrice={minPrice}
                existingItemForType={existingItemForType}
              />
            </form>
          </Form>
        </div>
      )}
    </ModalShell>
  );
}
