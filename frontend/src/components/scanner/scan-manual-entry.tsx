"use client";

import { useId, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CODE_TYPES, isCodeType, type CodeType } from "@/constants/card-codes";
import { hasValidCheckDigit } from "@/utils/barcode/check-digits";
import { normalizeScannedCode } from "@/utils/barcode/normalize-code";
import type { IScannedCode } from "@/typings/scanned-code";

interface IScanManualEntryProps {
  onSubmit: (code: IScannedCode) => void;
  onBack: () => void;
}

export default function ScanManualEntry({
  onSubmit,
  onBack,
}: IScanManualEntryProps) {
  const t = useTranslations("scanner");
  const inputId = useId();
  const errorId = useId();
  const [value, setValue] = useState("");
  const [codeType, setCodeType] = useState<CodeType>("code_128");
  const [submitted, setSubmitted] = useState(false);

  const trimmed = value.trim();
  const hasBadCheckDigit =
    trimmed !== "" && !hasValidCheckDigit(trimmed, codeType);
  const error = !submitted
    ? null
    : trimmed === ""
      ? t("manual.numberRequired")
      : hasBadCheckDigit
        ? t("manual.checkDigitMismatch")
        : null;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);

    if (trimmed === "" || hasBadCheckDigit) return;

    onSubmit(normalizeScannedCode({ rawValue: trimmed, format: codeType }));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <label htmlFor={inputId} className="text-sm font-medium">
          {t("manual.numberLabel")}
        </label>
        <Input
          id={inputId}
          value={value}
          autoComplete="off"
          inputMode="text"
          className="font-mono"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => setValue(event.target.value)}
        />
        {error && (
          <p id={errorId} role="alert" className="text-destructive text-sm">
            {error}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <span id={`${inputId}-type`} className="text-sm font-medium">
          {t("manual.typeLabel")}
        </span>
        <Select
          value={codeType}
          onValueChange={(next) => {
            if (isCodeType(next)) setCodeType(next);
          }}
        >
          <SelectTrigger aria-labelledby={`${inputId}-type`} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CODE_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {t(`codes.${type}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Button type="submit">{t("manual.submit")}</Button>
        <Button type="button" variant="ghost" onClick={onBack}>
          {t("manual.back")}
        </Button>
      </div>
    </form>
  );
}
