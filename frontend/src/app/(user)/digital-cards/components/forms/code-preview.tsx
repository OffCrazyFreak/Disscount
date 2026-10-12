"use client";

import { TriangleAlert } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";

import CardCode from "@/app/(user)/digital-cards/components/card-code";
import { generateCodeSvg } from "@/app/(user)/digital-cards/utils/generate-code-svg";
import type { DigitalCardRequest } from "@/lib/api/types";

export default function CodePreview() {
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
        aria-label="Pregled koda kartice"
        className="flex min-h-24 items-center justify-center rounded-lg border bg-white p-3"
      >
        {value ? (
          <div className="w-full max-w-xs">
            <CardCode value={value} codeType={codeType} textFallback={false} />
          </div>
        ) : (
          <p className="text-center text-sm text-neutral-500">
            Upiši broj kartice da vidiš pregled koda.
          </p>
        )}
      </div>

      {cannotEncode && (
        <p
          role="status"
          className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-300"
        >
          <TriangleAlert
            className="mt-0.5 size-4 shrink-0"
            aria-hidden="true"
          />
          Ovaj tip koda ne može prikazati upisani broj. Odaberi drugi tip ili
          &quot;Samo broj/tekst&quot;.
        </p>
      )}
    </div>
  );
}
