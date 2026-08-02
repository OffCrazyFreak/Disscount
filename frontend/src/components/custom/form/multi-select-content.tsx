"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { Command, CommandList } from "@/components/ui/command";
import { CollapsibleContent } from "@/components/ui/collapsible";
import { PopoverContent } from "@/components/ui/popover";
import MultiSelectPanel, {
  type MultiSelectSearch,
} from "@/components/custom/form/multi-select-panel";
import { useMultiSelectContext } from "@/components/custom/form/multi-select-context";
import useMultiSelectEscape from "@/components/custom/form/use-multi-select-escape";

interface IMultiSelectContentProps extends Omit<
  ComponentPropsWithoutRef<typeof Command>,
  "children"
> {
  search?: MultiSelectSearch;
  children: ReactNode;
}

export function MultiSelectContent({
  search = true,
  children,
  ...props
}: IMultiSelectContentProps) {
  const { open, presentation, setOpen, triggerRef } = useMultiSelectContext();

  useMultiSelectEscape(presentation === "inline" && open, () => {
    setOpen(false);
    triggerRef.current?.focus();
  });

  return (
    <>
      {/* Kept mounted so a selected badge still resolves its label while closed */}
      <div style={{ display: "none" }}>
        <Command>
          <CommandList>{children}</CommandList>
        </Command>
      </div>

      {presentation === "inline" ? (
        <CollapsibleContent
          // The global class animates the height, so the surrounding scroller
          // grows rather than jumping. `my-0` drops the primitive's own margin.
          className="CollapsibleContent my-0"
        >
          <div className="mt-2 rounded-md border bg-popover text-popover-foreground shadow-xs">
            <MultiSelectPanel
              search={search}
              // In flow the list can be any height without going off screen, but
              // it should still not swallow a short viewport whole.
              listClassName="max-h-[min(18.75rem,45dvh)]"
              {...props}
            >
              {children}
            </MultiSelectPanel>
          </div>
        </CollapsibleContent>
      ) : (
        <PopoverContent
          // One flex column capped by the room Radix says is actually left, so a
          // shrinking viewport shortens the list instead of pushing it off screen.
          collisionPadding={8}
          className="flex max-h-[var(--radix-popover-content-available-height)] min-w-[var(--radix-popover-trigger-width)] flex-col overflow-hidden p-0"
        >
          <MultiSelectPanel search={search} {...props}>
            {children}
          </MultiSelectPanel>
        </PopoverContent>
      )}
    </>
  );
}
