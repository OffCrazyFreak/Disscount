"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
} from "@/components/ui/command";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { DigitalCardFormData } from "@/lib/api/types";
import StoreNameOption from "@/app/(user)/digital-cards/components/forms/store-name-option";
import StoreNameTrigger from "@/app/(user)/digital-cards/components/forms/store-name-trigger";
import { useStoreNameOptions } from "@/app/(user)/digital-cards/hooks/use-store-name-options";

interface IStoreNameFieldProps {
  /** Fires only for an official chain, so the caller can offer its logo and brand colour. */
  onChainSelected: (chainCode: string | null) => void;
}

export default function StoreNameField({
  onChainSelected,
}: IStoreNameFieldProps) {
  const form = useFormContext<DigitalCardFormData>();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { officialOptions, suggestedOptions } = useStoreNameOptions({
    enabled: open,
  });

  const chainCode = form.watch("chainCode");

  function select(label: string, nextChainCode: string | null) {
    form.setValue("storeName", label, {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue("chainCode", nextChainCode, { shouldDirty: true });
    onChainSelected(nextChainCode);
    setOpen(false);
    setSearch("");
  }

  return (
    <FormField
      control={form.control}
      name="storeName"
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>Trgovina</FormLabel>

          <Popover open={open} onOpenChange={setOpen} modal={true}>
            <PopoverTrigger asChild>
              <FormControl>
                <StoreNameTrigger
                  open={open}
                  storeName={field.value}
                  chainCode={chainCode}
                  onClear={() => select("", null)}
                />
              </FormControl>
            </PopoverTrigger>

            <PopoverContent className="w-sm max-w-[75dvw] p-0">
              <Command>
                <CommandInput
                  placeholder="Pretraži trgovine ili upiši svoju..."
                  value={search}
                  onValueChange={setSearch}
                />
                <CommandList>
                  <CommandEmpty>
                    <p className="px-2 text-sm">
                      Nema pronađene trgovine. Upiši naziv i odaberi ga ispod.
                    </p>
                  </CommandEmpty>

                  {officialOptions.length > 0 && (
                    <CommandGroup heading="Službene trgovine">
                      {officialOptions.map((option) => (
                        <StoreNameOption
                          key={option.chainCode}
                          option={option}
                          isSelected={field.value === option.label}
                          onSelect={() =>
                            select(option.label, option.chainCode)
                          }
                        />
                      ))}
                    </CommandGroup>
                  )}

                  {suggestedOptions.length > 0 && (
                    <CommandGroup heading="Ostalo">
                      {suggestedOptions.map((option) => (
                        <StoreNameOption
                          key={option.label}
                          option={option}
                          isSelected={field.value === option.label}
                          onSelect={() => select(option.label, null)}
                        />
                      ))}
                    </CommandGroup>
                  )}

                  {/* Free entry is never blocked: a corner shop has no chain code. */}
                  {search.trim().length >= 2 && (
                    <CommandGroup heading="Nova trgovina">
                      <StoreNameOption
                        option={{ label: search.trim(), chainCode: null }}
                        isSelected={false}
                        onSelect={() => select(search.trim(), null)}
                      />
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <FormMessage />
        </FormItem>
      )}
    />
  );
}
