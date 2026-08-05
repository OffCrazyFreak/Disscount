"use client";

import { useCallback, useRef } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { Command, CommandList } from "@/components/ui/command";
import { CollapsibleContent } from "@/components/ui/collapsible";
import { PopoverContent } from "@/components/ui/popover";
import MultiSelectPanel, {
  type MultiSelectSearch,
} from "@/components/custom/form/multi-select-panel";
import { useMultiSelectContext } from "@/components/custom/form/multi-select-context";
import useMultiSelectEscape from "@/components/custom/form/use-multi-select-escape";
import useMultiSelectOutsidePointer from "@/components/custom/form/use-multi-select-outside-pointer";

interface IMultiSelectContentProps extends Omit<
  ComponentPropsWithoutRef<typeof Command>,
  "children" | "filter"
> {
  search?: MultiSelectSearch;
  children: ReactNode;
}

export default function MultiSelectContent({
  search = true,
  children,
  ...props
}: IMultiSelectContentProps) {
  const { open, presentation, setOpen, triggerRef } = useMultiSelectContext();
  const contentRef = useRef<HTMLDivElement>(null);

  const isInline = presentation === "inline";

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, [setOpen, triggerRef]);

  useMultiSelectEscape(isInline && open, contentRef, triggerRef, close);

  // No focus move on an outside press: the user is already on their way
  // somewhere else, and pulling focus back to the trigger would fight them.
  useMultiSelectOutsidePointer(isInline && open, contentRef, triggerRef, () =>
    setOpen(false),
  );

  return (
    <>
      {/* Kept mounted so a selected badge still resolves its label while closed */}
      <div style={{ display: "none" }}>
        <Command>
          <CommandList>{children}</CommandList>
        </Command>
      </div>

      {isInline ? (
        <CollapsibleContent
          ref={contentRef}
          // The global class animates the height, so the surrounding scroller
          // grows rather than jumping. `my-0` drops the primitive's own margin.
          className="CollapsibleContent my-0"
          // The field is focused at mount, while this box is still animating up
          // from zero height, so the browser scrolls to where it was rather than
          // where it lands. Re-doing it once the height settles is what keeps the
          // list above the keyboard on a phone.
          onAnimationEnd={() =>
            contentRef.current?.scrollIntoView({ block: "nearest" })
          }
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
          // Capped by the room Radix says is left, which binds once the viewport
          // is shorter than the list wants. CommandList keeps its own 300px, so
          // this shortens the list rather than growing it.
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
