"use client";

import { TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useFormContext, useWatch } from "react-hook-form";

import CardCode from "@/components/custom/card-code/card-code";
import { generateCodeSvg } from "@/utils/card-code/generate-code-svg";
import { CODE_TYPE_LABEL_KEYS } from "@/constants/card-codes";
import type { DigitalCardRequest } from "@/lib/api/types";

export default function CodePreview() {
  const t = useTranslations();
  const form = useFormContext<DigitalCardRequest>();
  const [codeValue, barcodeValue, codeType] = useWatch({
    control: form.control,
    name: ["codeValue", "barcodeValue", "codeType"],
  });

  // The barcode is what gets drawn, so the preview follows it when it differs.
  const value = (barcodeValue?.trim() || codeValue?.trim()) ?? "";
  const cannotEncode =
    !!value && codeType !== "unknown" && !generateCodeSvg(value, codeType).ok;

  return (
    <div className="space-y-2">
      <div
        role="group"
        aria-label={t("digitalCards.form.previewLabel")}
        className="flex min-h-24 items-center justify-center rounded-lg border bg-white p-3"
      >
        {value ? (
          <div className="w-full max-w-xs">
            <CardCode
              value={value}
              codeType={codeType}
              textFallback={codeType === "unknown"}
            />
          </div>
        ) : (
          <p className="text-center text-sm text-neutral-500">
            {t("digitalCards.form.previewEmpty")}
          </p>
        )}
      </div>

      {/* Always mounted: a region inserted together with its text is often not announced. */}
      <div role="status" aria-live="polite">
        {cannotEncode && (
          <p className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-300">
            <TriangleAlert
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
            {t("digitalCards.form.previewCannotEncode", {
              fallbackType: t(CODE_TYPE_LABEL_KEYS.unknown),
            })}
          </p>
        )}
      </div>
    </div>
  );
}
