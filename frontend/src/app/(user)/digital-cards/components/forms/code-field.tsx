"use client";

import { useFormContext } from "react-hook-form";
import { ScanBarcode } from "lucide-react";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCameraScanner } from "@/context/scanner-context";
import type { DigitalCardFormData } from "@/lib/api/types";
import { toCodeType } from "@/app/(user)/digital-cards/utils/code-symbologies";

export default function CodeField() {
  const form = useFormContext<DigitalCardFormData>();
  const { openScanner } = useCameraScanner();

  // The "all" preset accepts every symbology a loyalty card might carry, unlike the
  // product scanner which is locked to EAN.
  function handleScan() {
    openScanner({
      preset: "all",
      onScan: (code) => {
        form.setValue("codeValue", code.rawValue, {
          shouldDirty: true,
          shouldValidate: true,
        });
        form.setValue("codeType", toCodeType(code.format), {
          shouldDirty: true,
          shouldValidate: true,
        });
      },
    });
  }

  return (
    <FormField
      control={form.control}
      name="codeValue"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Broj ili kod kartice</FormLabel>
          <div className="flex items-start gap-2">
            <FormControl>
              <Input {...field} inputMode="text" className="font-mono" />
            </FormControl>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleScan}
                  aria-label="Skeniraj kod kartice"
                  className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-md border border-input bg-background text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <ScanBarcode aria-hidden="true" className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="px-2 py-1 text-xs">
                Skeniraj kod kartice
              </TooltipContent>
            </Tooltip>
          </div>
          <FormDescription>
            Skeniraj kod s kartice ili ga upiši ručno.
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
