"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Eye, TrendingDown, Percent } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { watchlistService, WatchType } from "@/lib/api";
import { ProductResponse } from "@/lib/cijene-api/schemas";
import { useQueryClient } from "@tanstack/react-query";
import ProductInfoDisplay from "@/app/products/components/product-info-display";
import {
  getAveragePrice,
  getMinPrice,
} from "@/app/products/utils/product-utils";
import FormWarning from "@/components/custom/form-warning";

interface IWatchlistItemModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  product: ProductResponse;
  initialWatchType?: WatchType;
}

export default function WatchlistItemModal({
  isOpen,
  onOpenChange,
  product,
  initialWatchType,
}: IWatchlistItemModalProps) {
  const queryClient = useQueryClient();

  const addToWatchlistMutation = watchlistService.useAddToWatchlist();
  const removeFromWatchlistMutation = watchlistService.useRemoveFromWatchlist();

  // Fetch existing watchlist items for this product
  const { data: existingWatchlistItems = [], isLoading: isCheckingWatchlist } =
    watchlistService.useGetWatchlistItemsByProductApiId(product?.ean || "");

  // Get current prices for reference
  const avgPrice = product ? getAveragePrice(product) : 0;
  const minPrice = product ? getMinPrice(product) : 0;

  // Form state
  const [watchType, setWatchType] = useState<WatchType>(
    initialWatchType || WatchType.percentage,
  );
  const [thresholdValue, setThresholdValue] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && initialWatchType) {
      setWatchType(initialWatchType);
    }
  }, [isOpen, initialWatchType]);

  // Find existing item for current watch type
  const existingItemForType = existingWatchlistItems.find(
    (item) => item.watchType === watchType,
  );

  // Determine if watchlist icon should show as tracked
  const isAnyTypeTracked = existingWatchlistItems.length > 0;

  // Reset form when modal opens or watch type changes
  useEffect(() => {
    if (isOpen && product) {
      setError(null);

      // Pre-fill with existing value if editing, otherwise set defaults
      if (existingItemForType) {
        setThresholdValue(existingItemForType.thresholdValue.toString());
      } else {
        // Set default values based on watch type
        if (watchType === WatchType.percentage) {
          setThresholdValue("10");
        } else {
          // ABSOLUTE - suggest 10% below min price
          const suggestedPrice =
            avgPrice > 0 ? Math.round(avgPrice * 0.1 * 100) / 100 : 0;
          setThresholdValue(
            suggestedPrice > 0 ? suggestedPrice.toString() : "",
          );
        }
      }
    }
  }, [isOpen, product, watchType, existingItemForType, avgPrice]);

  function getCurrentThresholdValue(): number {
    const parsedValue = Number.parseFloat(thresholdValue);

    if (!Number.isFinite(parsedValue)) {
      return watchType === WatchType.percentage ? 10 : 0;
    }

    return parsedValue;
  }

  function getThresholdSteps(): { primary: number; secondary: number } {
    if (watchType === WatchType.percentage) {
      return {
        primary: 5,
        secondary: 10,
      };
    }

    if (minPrice < 10) {
      return {
        primary: 0.5,
        secondary: 1,
      };
    }

    return {
      primary: 2,
      secondary: 5,
    };
  }

  const minThresholdValue = watchType === WatchType.absolute ? 0.1 : 1;
  const maxThresholdValue = watchType === WatchType.absolute ? 999 : 99;

  function updateThresholdBy(delta: number): void {
    const currentValue = getCurrentThresholdValue();
    const minValue = minThresholdValue;
    const maxValue = maxThresholdValue;

    const nextValue = Math.min(
      maxValue,
      Math.max(minValue, currentValue + delta),
    );

    if (watchType === WatchType.percentage) {
      setThresholdValue(`${Math.round(nextValue)}`);
      return;
    }

    setThresholdValue(nextValue.toFixed(2));
  }

  function validateForm(): boolean {
    const value = parseFloat(thresholdValue);

    if (isNaN(value)) {
      setError("Unesite valjanu vrijednost");
      return false;
    }

    if (
      watchType === WatchType.percentage &&
      (value < minThresholdValue || value > maxThresholdValue)
    ) {
      setError(
        `Postotak mora biti između ${minThresholdValue}% i ${maxThresholdValue}%`,
      );
      return false;
    } else if (
      watchType === WatchType.absolute &&
      (value < minThresholdValue || value > maxThresholdValue)
    ) {
      setError(
        `Iznos mora biti između ${minThresholdValue}€ i ${maxThresholdValue}€`,
      );
      return false;
    }

    setError(null);
    return true;
  }

  async function handleSubmit() {
    if (!product) return;
    if (!validateForm()) return;

    try {
      const isUpdate = !!existingItemForType;
      const oldValue = existingItemForType?.thresholdValue;

      await addToWatchlistMutation.mutateAsync({
        productApiId: product.ean,
        watchType: watchType,
        thresholdValue: parseFloat(thresholdValue),
      });

      // Invalidate queries
      queryClient.invalidateQueries({
        queryKey: watchlistService.QUERY_KEYS.all,
      });

      if (isUpdate) {
        toast.success(
          `Prag ažuriran s ${oldValue} na ${parseFloat(thresholdValue)}`,
        );
      } else {
        toast.success("Proizvod dodan na popis za praćenje");
      }

      onOpenChange(false);
    } catch {
      toast.error("Greška pri spremanju");
    }
  }

  async function handleRemove() {
    if (!existingItemForType) return;

    try {
      await removeFromWatchlistMutation.mutateAsync(existingItemForType.id);

      // Invalidate queries
      queryClient.invalidateQueries({
        queryKey: watchlistService.QUERY_KEYS.all,
      });

      toast.success(
        `Za proizvod se više ne prati ${existingItemForType.watchType === WatchType.percentage ? "postotak" : "cijena"}`,
      );
      onOpenChange(false);
    } catch {
      toast.error("Greška pri uklanjanju");
    }
  }

  // Build alert message about existing entries
  function buildAlertMessage(): string | null {
    if (existingWatchlistItems.length === 0) return null;

    const percentageItem = existingWatchlistItems.find(
      (item) => item.watchType === WatchType.percentage,
    );
    const absoluteItem = existingWatchlistItems.find(
      (item) => item.watchType === WatchType.absolute,
    );

    const parts: string[] = [];

    if (percentageItem) {
      parts.push(
        `minimalnim pragom postotka od ${Math.round(percentageItem.thresholdValue)}%`,
      );
    }

    if (absoluteItem) {
      parts.push(`minimalnim pragom cijene od ${absoluteItem.thresholdValue}€`);
    }

    return `Ovaj proizvod je već na popisu za praćenje s ${parts.join(" te ")}.`;
  }

  const alertMessage = buildAlertMessage();
  const thresholdSteps = getThresholdSteps();
  const currentThresholdValue = getCurrentThresholdValue();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="size-5 sm:size-6" />
            Dodaj na popis za praćenje
          </DialogTitle>
        </DialogHeader>

        {product && (
          <div className="mb-4">
            <ProductInfoDisplay product={product} enableActionButtons={false} />
          </div>
        )}

        <div className="space-y-6">
          {/* Watch Type Selection */}
          <Field>
            <FieldLabel>Način praćenja</FieldLabel>
            <FieldContent>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setWatchType(WatchType.absolute)}
                  className={`flex flex-col items-center justify-between rounded-md border-2 p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors ${
                    watchType === WatchType.absolute
                      ? "border-primary bg-primary/5"
                      : "border-muted"
                  }`}
                >
                  <TrendingDown className="mb-3 size-6" />
                  <span className="text-sm font-medium">Cijena</span>
                  <span className="text-xs text-muted-foreground text-center">
                    Obavijesti kad cijena padne za određeni iznos
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setWatchType(WatchType.percentage)}
                  className={`flex flex-col items-center justify-between rounded-md border-2 p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors ${
                    watchType === WatchType.percentage
                      ? "border-primary bg-primary/5"
                      : "border-muted"
                  }`}
                >
                  <Percent className="mb-3 size-6" />
                  <span className="text-sm font-medium">Postotak</span>
                  <span className="text-xs text-muted-foreground text-center">
                    Obavijesti kad sniženje bude veće od određenog postotka
                  </span>
                </button>
              </div>
            </FieldContent>
          </Field>

          {alertMessage && !isCheckingWatchlist && (
            <FormWarning
              title="Proizvod već na popisu za praćenje"
              text={alertMessage}
            />
          )}

          {/* Threshold Input */}
          <Field data-invalid={!!error}>
            <FieldLabel htmlFor="thresholdValue">
              Minimalno sniženje{" "}
              {watchType === WatchType.absolute ? "(€)" : "(%)"}:
            </FieldLabel>

            <FieldContent>
              <div className="flex items-center gap-4 mx-auto my-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  aria-label={`Smanji prag za ${thresholdSteps.secondary}`}
                  className="hidden sm:flex size-14 rounded-full shrink-0 text-lg font-bold"
                  onClick={() => updateThresholdBy(-thresholdSteps.secondary)}
                  disabled={
                    currentThresholdValue - thresholdSteps.secondary <
                    minThresholdValue
                  }
                >
                  -{thresholdSteps.secondary}
                </Button>

                <Button
                  type="button"
                  size="icon"
                  aria-label={`Smanji prag za ${thresholdSteps.primary}`}
                  className="size-13 rounded-full shrink-0 text-lg font-bold"
                  onClick={() => updateThresholdBy(-thresholdSteps.primary)}
                  disabled={
                    currentThresholdValue - thresholdSteps.primary <
                    minThresholdValue
                  }
                >
                  -{thresholdSteps.primary}
                </Button>

                <Input
                  id="thresholdValue"
                  type="number"
                  step={watchType === WatchType.absolute ? 0.5 : 5}
                  min={minThresholdValue}
                  max={maxThresholdValue}
                  placeholder={
                    watchType === WatchType.absolute ? "Npr. 12€" : "Npr. 15%"
                  }
                  value={thresholdValue}
                  onChange={(e) => setThresholdValue(e.target.value)}
                  className="text-center w-20 sm:w-40"
                />

                <Button
                  type="button"
                  size="icon"
                  aria-label={`Povećaj prag za ${thresholdSteps.primary}`}
                  className="size-13 rounded-full shrink-0 text-lg font-bold"
                  onClick={() => updateThresholdBy(thresholdSteps.primary)}
                  disabled={
                    currentThresholdValue + thresholdSteps.primary >
                    maxThresholdValue
                  }
                >
                  +{thresholdSteps.primary}
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  aria-label={`Povećaj prag za ${thresholdSteps.secondary}`}
                  className="hidden sm:flex size-14 rounded-full shrink-0 text-lg font-bold"
                  onClick={() => updateThresholdBy(thresholdSteps.secondary)}
                  disabled={
                    currentThresholdValue + thresholdSteps.secondary >
                    maxThresholdValue
                  }
                >
                  +{thresholdSteps.secondary}
                </Button>
              </div>
            </FieldContent>

            {existingItemForType?.watchType === watchType &&
              existingItemForType?.thresholdValue !==
                getCurrentThresholdValue() && (
                <FieldDescription className="text-xs ">
                  Minimalan prag će biti ažuriran s{" "}
                  {existingItemForType?.thresholdValue} na {thresholdValue}.
                </FieldDescription>
              )}

            {error && <FieldError>{error}</FieldError>}
          </Field>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Odustani
            </Button>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleRemove}
                disabled={
                  !existingItemForType ||
                  removeFromWatchlistMutation.isPending ||
                  isCheckingWatchlist
                }
              >
                Ukloni
              </Button>

              <Button
                type="button"
                onClick={handleSubmit}
                disabled={
                  addToWatchlistMutation.isPending || isCheckingWatchlist
                }
              >
                {addToWatchlistMutation.isPending
                  ? "Spremanje..."
                  : existingItemForType
                    ? "Ažuriraj"
                    : "Dodaj"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
