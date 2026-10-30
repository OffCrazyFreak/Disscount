"use client";

import { useTranslations } from "next-intl";
import { isCodeType, type CodeType } from "@/constants/card-codes";
import type { IScannedCode } from "@/typings/scanned-code";

interface ICodeChoiceListProps {
  codes: IScannedCode[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

export type CodeLabelTranslator = (
  key: `codes.${CodeType}` | "codes.fallback",
) => string;

export function formatLabel(
  code: IScannedCode,
  t: CodeLabelTranslator,
): string {
  if (code.format && isCodeType(code.format)) return t(`codes.${code.format}`);

  return code.format ?? t("codes.fallback");
}

export default function CodeChoiceList({
  codes,
  selectedIndex,
  onSelect,
}: ICodeChoiceListProps) {
  const t = useTranslations("scanner");

  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 text-sm font-medium">
        {t("confirm.chooseLegend")}
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
              {formatLabel(code, t)}
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
