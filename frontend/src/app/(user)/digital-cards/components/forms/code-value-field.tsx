"use client";

import { ScanBarcode } from "lucide-react";
import { useFormContext } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { isCodeType } from "@/constants/card-codes";
import { useCameraScanner } from "@/context/scanner-context";
import type { DigitalCardRequest } from "@/lib/api/types";
import type { IScannedCode } from "@/typings/scanned-code";

export default function CodeValueField() {
  const form = useFormContext<DigitalCardRequest>();
  const { openScanner } = useCameraScanner();

  function handleScan(code: IScannedCode) {
    const options = { shouldDirty: true, shouldValidate: true };
    const format = code.format ?? "";

    form.setValue("codeValue", code.rawValue, options);
    form.setValue("codeType", isCodeType(format) ? format : "unknown", options);
  }

  return (
    <FormField
      control={form.control}
      name="codeValue"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Broj kartice</FormLabel>

          <div className="flex gap-2">
            <FormControl>
              <Input
                {...field}
                autoComplete="off"
                spellCheck={false}
                className="font-mono"
              />
            </FormControl>

            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Skeniraj kod kartice kamerom"
              onClick={() =>
                openScanner({
                  preset: "all",
                  confirm: true,
                  onScan: handleScan,
                })
              }
            >
              <ScanBarcode aria-hidden="true" />
            </Button>
          </div>

          <FormMessage />
        </FormItem>
      )}
    />
  );
}
