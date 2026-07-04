"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Eye, TrendingDown, Percent } from "lucide-react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("watchModal");
  const tCommon = useTranslations("common");
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
      setError(t("invalidValue"));
      return false;
    }

    if (
      watchType === WatchType.percentage &&
      (value < minThresholdValue || value > maxThresholdValue)
    ) {
      setError(
        t("percentRange", {
          min: minThresholdValue,
          max: maxThresholdValue,
        }),
      );
      return false;
    } else if (
      watchType === WatchType.absolute &&
      (value < minThresholdValue || value > maxThresholdValue)
    ) {
      setError(
        t("amountRange", {
          min: minThresholdValue,
          max: maxThresholdValue,
        }),
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

      if (isUpdate) {
        toast.success(
          t("thresholdUpdated", {
            old: String(oldValue),
            new: parseFloat(thresholdValue),
          }),
        );
      } else {
        toast.success(t("added"));
      }

      onOpenChange(false);
    } catch {
      toast.error(t("saveError"));
    }
  }

  async function handleRemove() {
    if (!existingItemForType) return;

    try {
      await removeFromWatchlistMutation.mutateAsync(existingItemForType.id);

      toast.success(
        existingItemForType.watchType === WatchType.percentage
          ? t("removedPercent")
          : t("removedPrice"),
      );
      onOpenChange(false);
    } catch {
      toast.error(t("removeError"));
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
        t("existingPercentPart", {
          value: Math.round(percentageItem.thresholdValue),
        }),
      );
    }

    if (absoluteItem) {
      parts.push(t("existingAbsPart", { value: absoluteItem.thresholdValue }));
    }

    return t("existingText", { parts: parts.join(` ${t("existingJoin")} `) });
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
            {t("title")}
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
            <FieldLabel>{t("mode")}</FieldLabel>
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
                  <span className="text-sm font-medium">{t("priceMode")}</span>
                  <span className="text-xs text-muted-foreground text-center">
                    {t("priceModeHint")}
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
                  <span className="text-sm font-medium">{t("percentMode")}</span>
                  <span className="text-xs text-muted-foreground text-center">
                    {t("percentModeHint")}
                  </span>
                </button>
              </div>
            </FieldContent>
          </Field>

          {alertMessage && !isCheckingWatchlist && (
            <FormWarning title={t("existingTitle")} text={alertMessage} />
          )}

          {/* Threshold Input */}
          <Field data-invalid={!!error}>
            <FieldLabel htmlFor="thresholdValue">
              {watchType === WatchType.absolute
                ? t("minReductionAbs")
                : t("minReductionPct")}
            </FieldLabel>

            <FieldContent>
              <div className="flex items-center gap-4 mx-auto my-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  aria-label={t("decreaseThresholdBy", {
                    n: thresholdSteps.secondary,
                  })}
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
                  aria-label={t("decreaseThresholdBy", {
                    n: thresholdSteps.primary,
                  })}
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
                    watchType === WatchType.absolute
                      ? t("placeholderAbs")
                      : t("placeholderPct")
                  }
                  value={thresholdValue}
                  onChange={(e) => setThresholdValue(e.target.value)}
                  className="text-center w-20 sm:w-40"
                />

                <Button
                  type="button"
                  size="icon"
                  aria-label={t("increaseThresholdBy", {
                    n: thresholdSteps.primary,
                  })}
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
                  aria-label={t("increaseThresholdBy", {
                    n: thresholdSteps.secondary,
                  })}
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
                  {t("updatePreview", {
                    old: String(existingItemForType?.thresholdValue),
                    new: thresholdValue,
                  })}
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
              {tCommon("cancel")}
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
                {tCommon("remove")}
              </Button>

              <Button
                type="button"
                onClick={handleSubmit}
                disabled={
                  addToWatchlistMutation.isPending || isCheckingWatchlist
                }
              >
                {addToWatchlistMutation.isPending
                  ? t("saving")
                  : existingItemForType
                    ? tCommon("update")
                    : tCommon("add")}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
