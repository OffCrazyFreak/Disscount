"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
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
import StoreSuggestions from "@/app/[locale]/(user)/digital-cards/components/forms/store-field/store-suggestions";
import { useEscapeGuard } from "@/app/[locale]/(user)/digital-cards/components/forms/store-field/use-escape-guard";
import { useStoreOptions } from "@/app/[locale]/(user)/digital-cards/hooks/use-store-options";
import { DEFAULT_CARD_COLOR } from "@/app/[locale]/(user)/digital-cards/utils/card-palette";
import { defaultColorForChain } from "@/app/[locale]/(user)/digital-cards/utils/chain-default-colors";
import { useListChains } from "@/lib/cijene-api";
import type { DigitalCardRequest } from "@/lib/api/types";
import { getChainLabel } from "@/utils/labels";
import { normalizeForSearch } from "@/utils/strings";

const ICON_BUTTON_CLASS =
  "end-1 flex size-9 items-center justify-center rounded-md";

interface IStoreFieldProps {
  // Off when editing: a saved card's colour is a choice, not a default to replace.
  autoColor: boolean;
}

export default function StoreField({ autoColor }: IStoreFieldProps) {
  const t = useTranslations("digitalCards.form");
  const form = useFormContext<DigitalCardRequest>();
  const storeName = useWatch({ control: form.control, name: "storeName" });
  const groups = useStoreOptions(storeName ?? "");
  const chains = useListChains().data?.chains;

  // What the last chain pick wrote, so a later pick only replaces values the user left alone.
  const autoApplied = useRef<{ name: string | null; color: string | null }>({
    name: null,
    color: null,
  });

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

  function chainForLabel(text: string): string | null {
    const needle = normalizeForSearch(text.trim());
    if (!needle) return null;

    return (
      chains?.find(
        (code) => normalizeForSearch(getChainLabel(code)) === needle,
      ) ?? null
    );
  }

  function applyStore(name: string, chainCode: string | null) {
    const previousChain = form.getValues("chainCode") ?? null;
    const options = { shouldDirty: true, shouldValidate: true };

    form.setValue("storeName", name, options);
    if (chainCode === previousChain) return;
    form.setValue("chainCode", chainCode, { shouldDirty: true });
    if (!chainCode) return;

    const cardName = form.getValues("cardName").trim();
    if (!cardName || cardName === autoApplied.current.name) {
      form.setValue("cardName", name, options);
      autoApplied.current.name = name;
    }

    // The default colour or the last auto-picked one means the user never chose a colour.
    const color = form.getValues("cardColor").toLowerCase();
    if (
      autoColor &&
      (color === DEFAULT_CARD_COLOR.toLowerCase() ||
        color === autoApplied.current.color)
    ) {
      const next = defaultColorForChain(chainCode);
      form.setValue("cardColor", next, options);
      autoApplied.current.color = next.toLowerCase();
    }
  }

  function handleValueChange(value: string, reason: string) {
    const picked =
      reason === "item-press"
        ? groups
            .flatMap((group) => group.items)
            .find((option) => option.chainCode && option.label === value)
        : undefined;

    applyStore(value, picked?.chainCode ?? chainForLabel(value));
  }

  // Covers the chain list arriving after the text was typed.
  function resolveChainOnBlur() {
    const name = form.getValues("storeName") ?? "";
    const chainCode = chainForLabel(name);

    if (chainCode && chainCode !== (form.getValues("chainCode") ?? null)) {
      applyStore(name, chainCode);
    }
  }

  return (
    <FormField
      control={form.control}
      name="storeName"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("storeLabel")}</FormLabel>

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
                  placeholder={t("storePlaceholder")}
                  autoComplete="off"
                  onBlur={() => {
                    field.onBlur();
                    resolveChainOnBlur();
                  }}
                  className="h-10 px-3 pe-20 text-base md:text-sm"
                />
              </FormControl>

              <AutocompleteTrigger
                aria-label={t("storeShowSuggestions")}
                className={ICON_BUTTON_CLASS}
              />
              <AutocompleteClear
                aria-label={t("storeClear")}
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
