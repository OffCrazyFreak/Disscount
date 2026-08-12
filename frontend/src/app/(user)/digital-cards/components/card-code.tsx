"use client";

import { useMemo } from "react";

import { cn } from "@/lib/utils";
import type { CodeType } from "@/constants/card-codes";
import { generateCodeSvg } from "@/app/(user)/digital-cards/utils/generate-code-svg";

interface ICardCodeProps {
  codeValue: string;
  codeType: CodeType;
  /** Shows the value under the code, which the checkout view wants and a tile does not. */
  showValue?: boolean;
  className?: string;
}

/**
 * Renders the barcode or QR, or the plain value when the symbology cannot encode it. The
 * fallback is a feature, not an error path: a membership number with no barcode is still a
 * usable card, and the cashier can key it in.
 */
export default function CardCode({
  codeValue,
  codeType,
  showValue = false,
  className,
}: ICardCodeProps) {
  const result = useMemo(
    () => generateCodeSvg(codeValue, codeType),
    [codeValue, codeType],
  );

  return (
    <div className={cn("flex w-full flex-col items-center gap-2", className)}>
      {result.ok ? (
        <div
          className="w-full [&>svg]:h-auto [&>svg]:w-full"
          // Safe by construction: includetext is off, so no user text reaches the SVG.
          dangerouslySetInnerHTML={{ __html: result.svg }}
        />
      ) : (
        <p className="w-full break-all text-center text-xl font-semibold tracking-widest tabular-nums text-black">
          {codeValue}
        </p>
      )}

      {showValue && result.ok && (
        <p className="w-full break-all text-center text-sm tracking-wider tabular-nums text-black">
          {codeValue}
        </p>
      )}
    </div>
  );
}
