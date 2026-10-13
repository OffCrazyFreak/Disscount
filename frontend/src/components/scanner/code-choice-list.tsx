"use client";

import { CODE_TYPE_LABELS, isCodeType } from "@/constants/card-codes";
import type { IScannedCode } from "@/typings/scanned-code";

interface ICodeChoiceListProps {
  codes: IScannedCode[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

export function formatLabel(code: IScannedCode): string {
  return code.format && isCodeType(code.format)
    ? CODE_TYPE_LABELS[code.format]
    : (code.format ?? "Kod");
}

export default function CodeChoiceList({
  codes,
  selectedIndex,
  onSelect,
}: ICodeChoiceListProps) {
  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 text-sm font-medium">
        Odaberi kod koji blagajna skenira
      </legend>

      {codes.map((code, index) => (
        <label
          key={`${code.format}:${code.rawValue}`}
          className="has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:focus-visible]:ring-ring/50 flex cursor-pointer items-center gap-3 rounded-lg border p-3 has-[:focus-visible]:ring-[3px]"
        >
          <input
            type="radio"
            name="scanned-code"
            className="accent-primary size-4"
            checked={index === selectedIndex}
            onChange={() => onSelect(index)}
          />

          <span className="min-w-0">
            <span className="text-muted-foreground block text-xs">
              {formatLabel(code)}
            </span>
            <span className="block font-mono text-sm break-all">
              {code.rawValue}
            </span>
          </span>
        </label>
      ))}
    </fieldset>
  );
}
