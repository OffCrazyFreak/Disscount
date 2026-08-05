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

  // The animationend touch-up below cannot be the only correction: under
  // prefers-reduced-motion there is no animation and so no event, which would
  // leave exactly the users most likely to need it with the keyboard over the
  // list. Scrolling on open covers that, and is a no-op when already in view.
  useEffect(() => {
    if (!isInline || !open) return;

    const frame = requestAnimationFrame(() =>
      contentRef.current?.scrollIntoView({ block: "nearest" }),
    );

    return () => cancelAnimationFrame(frame);
  }, [isInline, open]);

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
          // Touch-up after the height settles. Guarded twice: animationend
          // bubbles, so a child's own animation would otherwise yank the
          // surrounding scroller back here, and the close animation would scroll
          // to a box that is collapsing to nothing.
          onAnimationEnd={(event) => {
            if (event.target !== event.currentTarget) return;
            if (event.currentTarget.dataset.state !== "open") return;

            contentRef.current?.scrollIntoView({ block: "nearest" });
          }}
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
