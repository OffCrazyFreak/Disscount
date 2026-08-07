"use client";

import { ChevronsUpDownIcon } from "lucide-react";
import {
  useCallback,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";

import { Button } from "@/components/ui/button";
import { CollapsibleTrigger } from "@/components/ui/collapsible";
import { PopoverTrigger } from "@/components/ui/popover";
import { useMultiSelectContext } from "@/components/custom/form/multi-select-context";
import { cn } from "@/lib/utils";

// Button's props are a union, so this cannot be an interface.
type IMultiSelectTriggerProps = {
  className?: string;
  children?: ReactNode;
} & ComponentPropsWithoutRef<typeof Button>;

export default function MultiSelectTrigger({
  className,
  children,
  ref,
  ...props
}: IMultiSelectTriggerProps & { ref?: React.Ref<HTMLButtonElement> }) {
  const { presentation, triggerRef } = useMultiSelectContext();

  // Composed, not overwritten: FormControl is a Slot, so a caller wiring
  // react-hook-form's field.ref for setFocus would otherwise be dropped here
  // and validation focus would silently do nothing.
  const setTrigger = useCallback(
    (node: HTMLButtonElement | null) => {
      triggerRef.current = node;

      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref, triggerRef],
  );

  // Both render as a Slot around the button, so the button below is the same
  // element either way and only the disclosure wiring differs.
  const Trigger =
    presentation === "inline" ? CollapsibleTrigger : PopoverTrigger;

  return (
    <Trigger asChild>
      <Button
        {...props}
        ref={setTrigger}
        variant={props.variant ?? "outline"}
        role={props.role ?? "combobox"}
        // aria-expanded is deliberately absent: both Triggers inject it through
        // Slot, and a value set here would win and could then disagree with the
        // disclosure's real state.
        className={cn(
          "flex h-auto min-h-10 w-fit items-center justify-between gap-2 overflow-hidden rounded-md border border-input bg-transparent px-3 py-1.5 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-[placeholder]:text-muted-foreground dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
          className,
        )}
      >
        {children}
        {/* Matches the single Select's chevron: opacity-50 over an inherited colour left
            the one affordance saying "this opens" barely visible. */}
        <ChevronsUpDownIcon
          aria-hidden="true"
          className="size-5 shrink-0 text-muted-foreground"
        />
      </Button>
    </Trigger>
  );
}
