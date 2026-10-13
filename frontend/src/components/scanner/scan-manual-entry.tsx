"use client";

import { useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CODE_TYPES,
  CODE_TYPE_LABELS,
  isCodeType,
  type CodeType,
} from "@/constants/card-codes";
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
      ? "Upiši broj koda."
      : hasBadCheckDigit
        ? "Broj ne odgovara odabranom tipu koda. Provjeri znamenke ili odaberi drugi tip."
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
          Broj kartice
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
          Tip koda
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
                {CODE_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Button type="submit">Nastavi</Button>
        <Button type="button" variant="ghost" onClick={onBack}>
          Natrag na skeniranje
        </Button>
      </div>
    </form>
  );
}
