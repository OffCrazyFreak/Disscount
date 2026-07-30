"use client";

import { TriangleAlert } from "lucide-react";

import type { CodeType } from "@/constants/card-codes";
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
  const result = generateCodeSvg(codeValue, codeType);
  const twoDimensional = isTwoDimensional(codeType);

  return (
    <div className="space-y-2">
      <div className="rounded-lg bg-white px-4 py-5 shadow-inner ring-1 ring-black/10">
        <div className={twoDimensional ? "mx-auto max-w-56" : "w-full"}>
          <CardCode codeValue={codeValue} codeType={codeType} showValue />
        </div>
      </div>

      {!result.ok && (
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
