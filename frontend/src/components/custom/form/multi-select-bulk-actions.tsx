"use client";

import type { KeyboardEvent } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { useMultiSelectContext } from "@/components/custom/form/multi-select-context";
import { commandFilter } from "@/utils/search/command-filter";

/**
 * "Select all" and "Clear all" above the list. With a search typed, select all
 * takes only the matches, as filter lists elsewhere do; clear all always
 * empties the selection. Disabled options are never selected.
 */
export default function MultiSelectBulkActions() {
  const t = useTranslations("common.multiSelect");
  const { options, selectedValues, searchValue, setValues } =
    useMultiSelectContext();

  const matching = [...options]
    .filter(
      ([value, option]) =>
        !option.disabled &&
        commandFilter(value, searchValue, option.keywords) > 0,
    )
    .map(([value]) => value);

  // cmdk's root takes Enter to pick the highlighted option, which would beat
  // the button's own click; stopping it here lets the button handle it.
  function keepEnter(event: KeyboardEvent) {
    if (event.key === "Enter") event.stopPropagation();
  }

  // Never disabled: a button that disables itself under the keyboard drops
  // focus to the page. With nothing to do, a press changes nothing.
  return (
    <div className="flex gap-1 border-b p-1">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onKeyDown={keepEnter}
        onClick={() =>
          setValues([...new Set([...selectedValues, ...matching])])
        }
        className="flex-1"
      >
        {t("selectAll")}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onKeyDown={keepEnter}
        onClick={() => setValues([])}
        className="flex-1"
      >
        {t("clearAll")}
      </Button>

      <p role="status" className="sr-only">
        {t("selected", { count: selectedValues.size })}
      </p>
    </div>
  );
}
