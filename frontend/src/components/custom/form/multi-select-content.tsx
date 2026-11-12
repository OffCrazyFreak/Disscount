"use client";

import { useCallback, useEffect, useRef } from "react";
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

  // Reduced motion fires no animationend, so scrolling on open keeps the list clear of the keyboard.
  useEffect(() => {
    if (!isInline || !open) return;

    const frame = requestAnimationFrame(() =>
      contentRef.current?.scrollIntoView({ block: "nearest" }),
    );

    return () => cancelAnimationFrame(frame);
  }, [isInline, open]);

  // No focus move on an outside press, because pulling focus back would fight a user on their way somewhere else.
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
          // The global class animates height so the scroller grows; `my-0` drops the primitive's margin.
          className="CollapsibleContent my-0"
          // Guarded because animationend bubbles, and closing would scroll to a collapsing box.
          onAnimationEnd={(event) => {
            if (event.target !== event.currentTarget) return;
            if (event.currentTarget.dataset.state !== "open") return;

            contentRef.current?.scrollIntoView({ block: "nearest" });
          }}
        >
          <div className="mt-2 rounded-md border bg-popover text-popover-foreground shadow-xs">
            <MultiSelectPanel
              search={search}
              // In flow the list can be any height, but it should not swallow a short viewport whole.
              listClassName="max-h-[min(18.75rem,45dvh)]"
              {...props}
            >
              {children}
            </MultiSelectPanel>
          </div>
        </CollapsibleContent>
      ) : (
        <PopoverContent
          // Capped by the room Radix says is left; CommandList keeps its own 300px, so this only shortens the list.
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
