"use client";

import { useFormContext } from "react-hook-form";
import { TriangleAlert } from "lucide-react";

import type { DigitalCardFormData } from "@/lib/api/types";
import { generateCodeSvg } from "@/app/(user)/digital-cards/utils/generate-code-svg";

/**
 * Confirms the chosen symbology actually encodes the value before the card is saved, which
 * is the whole reason codeType is user-editable: a wrong guess is invisible until a cashier
 * cannot scan it.
 */
export default function CodePreview() {
  const form = useFormContext<DigitalCardFormData>();
  const codeValue = form.watch("codeValue");
  const codeType = form.watch("codeType");

  if (!codeValue?.trim()) return null;

  const result = generateCodeSvg(codeValue, codeType);

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Prikaz koda</p>

      <div className="grid min-h-24 place-items-center rounded-md border bg-white p-3">
        {result.ok ? (
          <div
            className="w-full max-w-64 [&>svg]:h-auto [&>svg]:w-full"
            // Safe by construction: includetext is off, so no user text reaches the SVG.
            dangerouslySetInnerHTML={{ __html: result.svg }}
          />
        ) : (
          <p className="break-all text-center text-lg font-semibold tracking-widest tabular-nums text-black">
            {codeValue}
          </p>
        )}
      </div>

      {!result.ok && (
        <p className="flex items-start gap-1.5 text-xs text-amber-700">
          <TriangleAlert
            aria-hidden="true"
            className="mt-0.5 size-3.5 shrink-0"
          />
          <span>
            {result.reason === "unsupported"
              ? "Ovaj tip prikazuje samo broj, bez barkoda. Na blagajni pokaži broj ili sliku kartice."
              : "Kod se ne može prikazati za odabrani tip. Probaj drugi tip koda ili provjeri broj."}
          </span>
        </p>
      )}
    </div>
  );
}
