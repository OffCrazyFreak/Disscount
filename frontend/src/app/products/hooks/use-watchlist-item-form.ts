"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { watchlistService, WatchType } from "@/lib/api";
import { applyProblemToForm } from "@/lib/api/problem-details";
import { stashModalError, takeModalError } from "@/lib/modal/modal-error-bus";
import { closeModalUrl, openModalUrl } from "@/lib/modal/modal-navigation";
import { removeFormDraft } from "@/utils/browser/local-storage";
import {
  WatchlistFormData,
  watchlistFormSchema,
} from "@/app/products/typings/watchlist-form";

export function useWatchlistItemForm(
  open: boolean,
  ean: string,
  avgPrice: number,
  initialWatchType?: WatchType
) {
  const draftKey = `watchlist.${ean}`;

  const addMutation = watchlistService.useAddToWatchlist();
  const removeMutation = watchlistService.useRemoveFromWatchlist();
  const { data: existingItems = [], isLoading: isCheckingWatchlist } =
    watchlistService.useGetWatchlistItemsByProductApiId(ean);

  const form = useForm<WatchlistFormData>({
    resolver: zodResolver(watchlistFormSchema),
    mode: "onChange",
    defaultValues: {
      watchType: initialWatchType ?? WatchType.percentage,
      thresholdValue: "",
    },
  });

  const watchType = form.watch("watchType");
  const existingItemForType = existingItems.find(
    (item) => item.watchType === watchType
  );

  // Prefill the threshold with the tracked value (or a sensible default) when
  // the type changes; user-typed (dirty) values are never overwritten.
  useEffect(() => {
    if (form.formState.dirtyFields.thresholdValue) return;

    if (existingItemForType) {
      form.setValue(
        "thresholdValue",
        existingItemForType.thresholdValue.toString()
      );
    } else if (watchType === WatchType.percentage) {
      form.setValue("thresholdValue", "10");
    } else {
      const suggested = avgPrice > 0 ? Math.round(avgPrice * 0.1 * 100) / 100 : 0;
      form.setValue("thresholdValue", suggested > 0 ? suggested.toString() : "");
    }
  }, [watchType, existingItemForType, avgPrice, form]);

  // A failed optimistic save reopened this modal: surface the server error.
  useEffect(() => {
    if (!open) return;
    const error = takeModalError(draftKey);
    if (error) applyProblemToForm(error, form.setError);
  }, [open, draftKey, form]);

  // Optimistic close: the modal closes immediately and reopens only on failure.
  async function onSubmit(data: WatchlistFormData) {
    closeModalUrl();

    const isUpdate = !!existingItemForType;
    const oldValue = existingItemForType?.thresholdValue;

    try {
      await addMutation.mutateAsync({
        productApiId: ean,
        watchType: data.watchType,
        thresholdValue: Number.parseFloat(data.thresholdValue),
      });

      removeFormDraft(draftKey);
      toast.success(
        isUpdate
          ? `Prag ažuriran s ${oldValue} na ${Number.parseFloat(data.thresholdValue)}`
          : "Proizvod dodan na popis za praćenje"
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

  async function onRemove() {
    if (!existingItemForType) return;
    closeModalUrl();

    try {
      await removeMutation.mutateAsync(existingItemForType.id);
      removeFormDraft(draftKey);
      toast.success(
        `Za proizvod se više ne prati ${
          existingItemForType.watchType === WatchType.percentage
            ? "postotak"
            : "cijena"
        }`
      );
    } catch {
      toast.error("Greška pri uklanjanju");
    }
  }

  return {
    form,
    draftKey,
    existingItems,
    existingItemForType,
    isCheckingWatchlist,
    onSubmit,
    onRemove,
    isSaving: addMutation.isPending,
    isRemoving: removeMutation.isPending,
  };
}
