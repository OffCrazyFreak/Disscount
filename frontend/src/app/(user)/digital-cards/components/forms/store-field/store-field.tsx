"use client";

import { useRef, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import {
  Autocomplete,
  AutocompleteClear,
  AutocompleteInput,
  AutocompleteTrigger,
} from "@/components/reui/autocomplete";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import StoreSuggestions from "@/app/(user)/digital-cards/components/forms/store-field/store-suggestions";
import { useEscapeGuard } from "@/app/(user)/digital-cards/components/forms/store-field/use-escape-guard";
import { useStoreOptions } from "@/app/(user)/digital-cards/hooks/use-store-options";
import { defaultColorForChain } from "@/app/(user)/digital-cards/utils/chain-default-colors";
import type { DigitalCardRequest } from "@/lib/api/types";
import { getChainLabel } from "@/utils/labels";

const ICON_BUTTON_CLASS =
  "end-1 flex size-9 items-center justify-center rounded-md";

interface IStoreFieldProps {
  // Off when editing: a saved card's colour is a choice, not a default to replace.
  autoColor: boolean;
}

export default function StoreField({ autoColor }: IStoreFieldProps) {
  const form = useFormContext<DigitalCardRequest>();
  const storeName = useWatch({ control: form.control, name: "storeName" });
  const groups = useStoreOptions(storeName ?? "");

  const wrapperRef = useRef<HTMLDivElement>(null);
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);

  useEscapeGuard(open, () => setOpen(false));

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setContainer(
        wrapperRef.current?.closest<HTMLElement>(
          '[data-slot="dialog-content"]',
        ) ?? null,
      );
    }
    setOpen(nextOpen);
  }

  function applyStore(name: string, chainCode: string | null) {
    const previousChain = form.getValues("chainCode") ?? null;
    const options = { shouldDirty: true, shouldValidate: true };

    form.setValue("storeName", name, options);
    if (chainCode === previousChain) return;
    form.setValue("chainCode", chainCode, { shouldDirty: true });
    if (!chainCode) return;

    const previousLabel = previousChain ? getChainLabel(previousChain) : "";
    const cardName = form.getValues("cardName").trim();
    if (!cardName || cardName === previousLabel) {
      form.setValue("cardName", name, options);
    }

    // Colour still equal to the old default means the user never chose one.
    const color = form.getValues("cardColor").toLowerCase();
    if (
      autoColor &&
      color === defaultColorForChain(previousChain).toLowerCase()
    ) {
      form.setValue("cardColor", defaultColorForChain(chainCode), options);
    }
  }

  function handleValueChange(value: string, reason: string) {
    const picked =
      reason === "item-press"
        ? groups
            .flatMap((group) => group.items)
            .find((option) => option.chainCode && option.label === value)
        : undefined;

    applyStore(value, picked?.chainCode ?? null);
  }

  return (
    <FormField
      control={form.control}
      name="storeName"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Trgovina</FormLabel>

          <div ref={wrapperRef} className="relative">
            <Autocomplete
              items={groups}
              filter={null}
              open={open}
              onOpenChange={handleOpenChange}
              openOnInputClick
              value={field.value ?? ""}
              onValueChange={(value, details) =>
                handleValueChange(value, details.reason)
              }
            >
              <FormControl>
                <AutocompleteInput
                  placeholder="Odaberi ili upiši trgovinu"
                  autoComplete="off"
                  onBlur={field.onBlur}
                  className="h-10 px-3 pe-20 text-base md:text-sm"
                />
              </FormControl>

              <AutocompleteTrigger
                aria-label="Prikaži prijedloge trgovina"
                className={ICON_BUTTON_CLASS}
              />
              <AutocompleteClear
                aria-label="Očisti trgovinu"
                className={ICON_BUTTON_CLASS}
              />

              <StoreSuggestions container={container} />
            </Autocomplete>
          </div>

          <FormMessage />
        </FormItem>
      )}
    />
  );
}
