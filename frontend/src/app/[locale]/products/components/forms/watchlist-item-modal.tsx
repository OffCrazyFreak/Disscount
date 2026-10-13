"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Eye, TriangleAlert } from "lucide-react";
import { useFormState } from "react-hook-form";

import EyePen from "@/components/custom/icons/eye-pen";

import { ModalShell } from "@/components/custom/modal/modal-shell";
import { Form } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import RemoveIconButton from "@/components/custom/common/remove-icon-button";
import { WatchType } from "@/lib/api";
import cijeneService from "@/lib/cijene-api";
import { closeModalUrl } from "@/lib/modal/modal-navigation";
import type { WatchTypeParam } from "@/lib/modal/modal-registry";
import ProductInfoDisplay from "@/app/[locale]/products/components/product-info-display";
import { Banner } from "@/components/custom/common/banner";
import {
  getAveragePrice,
  getMinPrice,
} from "@/app/[locale]/products/utils/product-utils";
import WatchlistTypePicker from "@/app/[locale]/products/components/forms/watchlist-type-picker";
import FormRootError from "@/components/custom/common/form-root-error";
import WatchlistThresholdInput from "@/app/[locale]/products/components/forms/watchlist-threshold-input";
import { useWatchlistItemForm } from "@/app/[locale]/products/hooks/use-watchlist-item-form";
import { useFormDraft } from "@/hooks/use-form-draft";
import type { WatchlistItemDto } from "@/lib/api/schemas/watchlist";

interface IWatchlistItemModalProps {
  open: boolean;
  ean: string;
  watchType?: WatchTypeParam;
}

function buildAlertMessage(
  items: WatchlistItemDto[],
  t: ReturnType<typeof useTranslations<"products">>,
): string | null {
  if (items.length === 0) return null;

  const percentageItem = items.find(
    (item) => item.watchType === WatchType.percentage,
  );
  const absoluteItem = items.find(
    (item) => item.watchType === WatchType.absolute,
  );

  if (percentageItem && absoluteItem) {
    return t("watchlistModal.existingBoth", {
      percentage: Math.round(percentageItem.thresholdValue),
      amount: absoluteItem.thresholdValue,
    });
  }
  if (percentageItem) {
    return t("watchlistModal.existingPercentage", {
      percentage: Math.round(percentageItem.thresholdValue),
    });
  }
  if (absoluteItem) {
    return t("watchlistModal.existingAbsolute", {
      amount: absoluteItem.thresholdValue,
    });
  }

  return null;
}

export default function WatchlistItemModal({
  open,
  ean,
  watchType,
}: IWatchlistItemModalProps) {
  const t = useTranslations("products");
  const productQuery = cijeneService.useGetProductByEan({ ean });
  const product = productQuery.data;

  const avgPrice = product ? (getAveragePrice(product) ?? 0) : 0;
  const minPrice = product ? (getMinPrice(product) ?? 0) : 0;

  const {
    form,
    draftKey,
    existingItems,
    existingItemForType,
    isCheckingWatchlist,
    isFormValid,
    isEdited,
    isEditedInAnyMode,
    hasSavableChange,
    resetForm,
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
  const { errors } = useFormState({ control: form.control });

  const { clearDraft } = useFormDraft({
    draftKey,
    form,
    enabled: open && !isCheckingWatchlist,
    // The mode comes from the button that opened the modal, so it is never drafted:
    // arriving from the € button must not land you on % because that is where you
    // left off. The numbers are drafted per mode, so neither one is lost.
    exclude: ["watchType"],
  });

  // Stays mounted between opens, so the URL's type must sync on change too.
  useEffect(() => {
    if (!open || !watchType) return;
    form.setValue(
      "watchType",
      watchType === "absolute" ? WatchType.absolute : WatchType.percentage,
    );
  }, [open, watchType, form]);

  const alertMessage = buildAlertMessage(existingItems, t);

  return (
    <ModalShell
      open={open}
      onOpenChange={(isOpen) => !isOpen && closeModalUrl()}
      title={t("watchlistModal.title")}
      description={t("watchlistModal.description")}
      srOnlyDescription
      dirty={isEdited}
      formId="watchlist-form"
      submitLabel={
        existingItemForType
          ? t("watchlistModal.save")
          : t("watchlistModal.track")
      }
      // EyePen rather than a generic Save, so editing an existing alert is marked the
      // same way here as on the product row that opened this.
      submitIcon={existingItemForType ? EyePen : Eye}
      submitLoading={isSaving}
      submitDisabled={
        isCheckingWatchlist || !product || !isFormValid || !hasSavableChange
      }
      cancelLabel={t("watchlistModal.cancel")}
      resetLabel={t("watchlistModal.reset")}
      // Enabled while either mode's number differs from what is tracked, including
      // the one not on screen, because reset puts both of them back.
      resetDisabled={!isEditedInAnyMode}
      onReset={() => {
        clearDraft();
        resetForm();
      }}
    >
      {productQuery.isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : !product ? (
        <p className="text-sm text-muted-foreground">
          {t("watchlistModal.productNotFound")}
        </p>
      ) : (
        <div className="space-y-6">
          <ProductInfoDisplay
            product={product}
            enableActionButtons={false}
            action={
              existingItems.length > 0 ? (
                <RemoveIconButton
                  label={t("watchlistModal.removeFromWatchlist")}
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
              <FormRootError message={errors.root?.message} />

              <WatchlistTypePicker />

              {alertMessage && !isCheckingWatchlist && (
                <Banner
                  variant="warningSoft"
                  size="lg"
                  icon={TriangleAlert}
                  title={t("watchlistModal.existingTitle")}
                  text={alertMessage}
                />
              )}

              <WatchlistThresholdInput
                minPrice={minPrice}
                existingItemForType={existingItemForType}
                loading={isCheckingWatchlist}
              />
            </form>
          </Form>
        </div>
      )}
    </ModalShell>
  );
}
