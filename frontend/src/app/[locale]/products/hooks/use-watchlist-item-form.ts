"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { watchlistService, WatchType } from "@/lib/api";
import { useModalError } from "@/hooks/use-modal-error";
import { stashModalError } from "@/lib/modal/modal-error-bus";
import { closeModalUrl, openModalUrl } from "@/lib/modal/modal-navigation";
import { removeFormDraftField } from "@/utils/browser/local-storage";
import {
  isSameThreshold,
  parseThreshold,
  thresholdBaselines,
} from "@/app/[locale]/products/utils/watchlist-thresholds";
import {
  thresholdField,
  WatchlistFormData,
  watchlistFormSchema,
} from "@/app/[locale]/products/typings/watchlist-form";

export function useWatchlistItemForm(
  open: boolean,
  ean: string,
  avgPrice: number,
  initialWatchType?: WatchType,
) {
  const t = useTranslations("products");
  const draftKey = `watchlist.${ean}`;
  const openingWatchType = initialWatchType ?? WatchType.percentage;

  const addMutation = watchlistService.useAddToWatchlist();
  const removeMutation = watchlistService.useRemoveFromWatchlist();
  const { data: existingItems = [], isLoading: isCheckingWatchlist } =
    watchlistService.useGetWatchlistItemsByProductApiId(ean);

  const form = useForm<WatchlistFormData>({
    resolver: zodResolver(watchlistFormSchema),
    mode: "onChange",
    defaultValues: {
      watchType: openingWatchType,
      percentageValue: "",
      absoluteValue: "",
    },
  });

  // useWatch, because the React Compiler skips memoizing any component that reads watch().
  const watchType = useWatch({
    control: form.control,
    name: "watchType",
    defaultValue: openingWatchType,
  });
  const percentageValue = useWatch({
    control: form.control,
    name: "percentageValue",
  });
  const absoluteValue = useWatch({
    control: form.control,
    name: "absoluteValue",
  });

  const baselines = thresholdBaselines(existingItems, avgPrice);
  const existingItemForType = existingItems.find(
    (item) => item.watchType === watchType,
  );

  // reset, because resetField needs registered names; it skips the resolver, so isFormValid parses itself.
  useEffect(() => {
    form.reset(
      {
        watchType: form.getValues("watchType"),
        percentageValue: baselines.percentageValue,
        absoluteValue: baselines.absoluteValue,
      },
      { keepDirtyValues: true },
    );
    // baselines is rebuilt every render, so depend on its values, not its identity.
  }, [baselines.percentageValue, baselines.absoluteValue, form]);

  useModalError(open, draftKey, form);

  // No keepDirtyValues, unlike the seed above, because discarding the edits is the entire point.
  function resetForm() {
    form.reset({
      watchType: openingWatchType,
      percentageValue: baselines.percentageValue,
      absoluteValue: baselines.absoluteValue,
    });
  }

  // Optimistic close: the modal closes immediately and reopens only on failure.
  async function onSubmit(data: WatchlistFormData) {
    closeModalUrl();

    const field = thresholdField(data.watchType);
    const value = parseThreshold(data[field]);
    const saved = existingItems.find(
      (item) => item.watchType === data.watchType,
    );

    try {
      await addMutation.mutateAsync({
        productApiId: ean,
        watchType: data.watchType,
        thresholdValue: value,
      });

      removeFormDraftField(draftKey, field);
      toast.success(
        saved
          ? t("watchlistModal.toast.updated", {
              from: saved.thresholdValue,
              to: value,
            })
          : t("watchlistModal.toast.added"),
      );
    } catch (error) {
      stashModalError(draftKey, error);
      openModalUrl({
        name: "watchlist",
        ean,
        watchType:
          data.watchType === WatchType.absolute ? "absolute" : "percentage",
      });
    }
  }

  // Falls back to the other tracked entry, so the red X works from either mode.
  async function onRemove() {
    const target = existingItemForType ?? existingItems[0];
    if (!target) return;
    closeModalUrl();

    try {
      await removeMutation.mutateAsync(target.id);
      removeFormDraftField(draftKey, thresholdField(target.watchType));
      toast.success(
        target.watchType === WatchType.percentage
          ? t("watchlistModal.toast.removedPercentage")
          : t("watchlistModal.toast.removedAbsolute"),
      );
    } catch {
      toast.error(t("watchlistModal.toast.removeFailed"));
    }
  }

  const activeValue =
    watchType === WatchType.absolute ? absoluteValue : percentageValue;

  // Parsed, because formState.isValid refreshes only when the resolver runs, which reset skips.
  const isFormValid = watchlistFormSchema.safeParse({
    watchType,
    percentageValue,
    absoluteValue,
  }).success;

  return {
    form,
    draftKey,
    existingItems,
    existingItemForType,
    isCheckingWatchlist,
    isFormValid,
    // A dirty flag can outlive its edit, and a hidden mode's draft would stick the marker for 24h.
    isEdited: !isSameThreshold(
      activeValue,
      watchType === WatchType.absolute
        ? baselines.absoluteValue
        : baselines.percentageValue,
    ),
    isEditedInAnyMode:
      !isSameThreshold(percentageValue, baselines.percentageValue) ||
      !isSameThreshold(absoluteValue, baselines.absoluteValue),
    // Re-saving the tracked threshold unchanged is a no-op, so the button waits for a different number.
    hasSavableChange:
      !existingItemForType ||
      parseThreshold(activeValue) !== existingItemForType.thresholdValue,
    resetForm,
    onSubmit,
    onRemove,
    isSaving: addMutation.isPending,
    isRemoving: removeMutation.isPending,
  };
}
