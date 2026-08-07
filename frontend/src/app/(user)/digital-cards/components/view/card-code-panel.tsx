"use client";

import { useMemo } from "react";
import { TriangleAlert } from "lucide-react";

import type { CodeType } from "@/constants/card-codes";
import CopyButton from "@/components/custom/common/copy-button";
import CardCode from "@/app/(user)/digital-cards/components/card-code";
import {
  generateCodeSvg,
  isTwoDimensional,
} from "@/app/(user)/digital-cards/utils/generate-code-svg";

interface ICardCodePanelProps {
  codeValue: string;
  codeType: CodeType;
}

/**
 * Deliberately clinical: forced white, forced black, generous quiet zone and no theming.
 * A scanner needs contrast, not styling, and a dark-mode panel would not read at all.
 */
export default function CardCodePanel({
  codeValue,
  codeType,
}: ICardCodePanelProps) {
  // Only to decide whether the warning shows; CardCode memoizes its own encode.
  const isRenderable = useMemo(
    () => generateCodeSvg(codeValue, codeType).ok,
    [codeValue, codeType],
  );
  const twoDimensional = isTwoDimensional(codeType);

  return (
    <div className="space-y-2">
      {/* bg-white is literal on purpose: a dark-mode panel would not scan at the till. */}
      <div className="rounded-lg bg-white px-4 py-5 shadow-inner ring-1 ring-black/10">
        <div className={twoDimensional ? "mx-auto max-w-56" : "w-full"}>
          <CardCode codeValue={codeValue} codeType={codeType} showValue />
        </div>
      </div>

      {/* A cashier sometimes has to key the number in, and reading it off a screen is
          where digits get transposed. */}
      <div className="flex justify-center">
        <CopyButton
          value={codeValue}
          label="Kopiraj broj kartice"
          successMessage="Broj kartice je kopiran!"
        />
      </div>

      {!isRenderable && (
        <p className="flex items-start gap-1.5 text-xs text-amber-700">
          <TriangleAlert
            aria-hidden="true"
            className="mt-0.5 size-3.5 shrink-0"
          />
          <span>
            Kod se ne može prikazati za odabrani tip. Pokaži broj na blagajni
            ili sliku kartice.
          </span>
        </p>
      )}
    </div>
  );
}
