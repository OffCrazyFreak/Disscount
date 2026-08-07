"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { watchlistService, WatchType } from "@/lib/api";
import { applyProblemToForm } from "@/lib/api/problem-details";
import { stashModalError, takeModalError } from "@/lib/modal/modal-error-bus";
import { closeModalUrl, openModalUrl } from "@/lib/modal/modal-navigation";
import { removeFormDraftField } from "@/utils/browser/local-storage";
import {
  isSameThreshold,
  parseThreshold,
  thresholdBaselines,
} from "@/app/products/utils/watchlist-thresholds";
import {
  thresholdField,
  WatchlistFormData,
  watchlistFormSchema,
} from "@/app/products/typings/watchlist-form";

export function useWatchlistItemForm(
  open: boolean,
  ean: string,
  avgPrice: number,
  initialWatchType?: WatchType,
) {
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

  // useWatch, not form.watch: watch() signals changes outside React state, so the
  // React Compiler skips memoizing every component that reads it.
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

  // reset, not resetField: resetField only works on a name that is registered right
  // now, and neither number is while the product loads, nor is the mode that is not
  // on screen. So the prefill landed on nothing. reset writes both values and both
  // defaults regardless, which is what makes an untouched prefill not a change, and
  // keepDirtyValues leaves a number the user (or a restored draft) has already
  // edited alone. It also refreshes isValid without filling in errors, so the submit
  // button is live for a valid prefill and nothing is marked red before it is
  // touched.
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

  // A failed optimistic save reopened this modal: surface the server error.
  useEffect(() => {
    if (!open) return;
    const error = takeModalError(draftKey);
    if (error) applyProblemToForm(error, form);
  }, [open, draftKey, form]);

  // Undoes the whole session: both numbers and the mode the modal opened in. No
  // keepDirtyValues here, unlike the seed above, because discarding the edits is
  // the entire point.
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
          ? `Prag ažuriran s ${saved.thresholdValue} na ${value}`
          : "Proizvod dodan na popis za praćenje",
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
        `Za proizvod se više ne prati ${
          target.watchType === WatchType.percentage ? "postotak" : "cijena"
        }`,
      );
    } catch {
      toast.error("Greška pri uklanjanju");
    }
  }

  const activeValue =
    watchType === WatchType.absolute ? absoluteValue : percentageValue;

  return {
    form,
    draftKey,
    existingItems,
    existingItemForType,
    isCheckingWatchlist,
    // Compared against the baselines rather than read off RHF's dirtyFields: the
    // seed keeps dirty flags so an in-progress edit survives a refetch, which means
    // a flag can outlive the edit itself (a saved value equals its new baseline but
    // stays flagged). The comparison cannot drift that way. Only the numbers count,
    // so switching mode is never a change.
    // Scoped to the mode on screen. Comparing both modes lit the unsaved marker for a
    // number the user cannot see and cannot save from here: a draft restores the other
    // mode's value, and onSubmit only clears the field it saved, so the marker stuck for
    // the whole 24h draft life. resetDisabled keeps the both-modes comparison, because
    // reset genuinely clears both.
    isEdited: !isSameThreshold(
      activeValue,
      watchType === WatchType.absolute
        ? baselines.absoluteValue
        : baselines.percentageValue,
    ),
    isEditedInAnyMode:
      !isSameThreshold(percentageValue, baselines.percentageValue) ||
      !isSameThreshold(absoluteValue, baselines.absoluteValue),
    // Re-saving the tracked threshold unchanged is a no-op, so the button waits
    // for a different number. A mode with nothing tracked yet is always savable.
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
