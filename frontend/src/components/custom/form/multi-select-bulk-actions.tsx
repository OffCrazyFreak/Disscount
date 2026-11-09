"use client";

import type { KeyboardEvent } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { useMultiSelectContext } from "@/components/custom/form/multi-select-context";
import { commandFilter } from "@/utils/search/command-filter";

/** With a search typed, select all takes only the matches, as filter lists elsewhere do. */
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

  // cmdk's root takes Enter to pick the highlighted option, which would beat the button's own click.
  function keepEnter(event: KeyboardEvent) {
    if (event.key === "Enter") event.stopPropagation();
  }

  // Never disabled, because a button disabling itself under the keyboard drops focus to the page.
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
