"use client";

import { useRef, type ComponentPropsWithoutRef, type ReactNode } from "react";

import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandList,
} from "@/components/ui/command";
import ScrollFade from "@/components/custom/common/scroll-fade";
import { useMultiSelectContext } from "@/components/custom/form/multi-select-context";
import { commandFilter } from "@/utils/search/command-filter";
import { cn } from "@/lib/utils";

export type MultiSelectSearch =
  boolean | { placeholder?: string; emptyMessage?: string };

interface IMultiSelectPanelProps extends Omit<
  ComponentPropsWithoutRef<typeof Command>,
  "children" | "filter"
> {
  search: MultiSelectSearch;
  /** Caps the list where the surrounding presentation cannot do it itself. */
  listClassName?: string;
  children: ReactNode;
}

/** The searchable list, identical whether it floats in a popover or sits inline. */
export default function MultiSelectPanel({
  search,
  listClassName,
  className,
  children,
  ...props
}: IMultiSelectPanelProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const { searchValue, setSearchValue, presentation } = useMultiSelectContext();

  const canSearch = typeof search === "object" ? true : search;

  return (
    <Command
      {...props}
      filter={commandFilter}
      className={cn("min-h-0 flex-1", className)}
    >
      {canSearch ? (
        <CommandInput
          value={searchValue}
          onValueChange={setSearchValue}
          // Inline has no Radix layer to move focus in for it. Letting the
          // browser scroll the focused field into view is the whole point of
          // being in flow, so this does not use preventScroll.
          autoFocus={presentation === "inline"}
          placeholder={
            typeof search === "object" ? search.placeholder : undefined
          }
        />
      ) : (
        <button autoFocus className="sr-only" />
      )}

      {/* Wraps only the list, so the top fade sits under the search box
          rather than over it */}
      <div className="relative flex min-h-0 flex-1 flex-col">
        <ScrollFade
          targetRef={listRef}
          side="top"
          className="from-popover h-10"
        />

        <CommandList
          ref={listRef}
          className={cn("min-h-0 flex-1", listClassName)}
        >
          {canSearch && (
            <CommandEmpty>
              {typeof search === "object" ? search.emptyMessage : undefined}
            </CommandEmpty>
          )}
          {children}
        </CommandList>

        <ScrollFade
          targetRef={listRef}
          className="from-popover h-10 rounded-b-md"
        />
      </div>
    </Command>
  );
}
