"use client";

import {
  useEffect,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import { CheckIcon } from "lucide-react";

import { CommandItem } from "@/components/ui/command";
import { useMultiSelectContext } from "@/components/custom/form/multi-select-context";
import { cn } from "@/lib/utils";

interface IMultiSelectItemProps extends Omit<
  ComponentPropsWithoutRef<typeof CommandItem>,
  "value"
> {
  badgeLabel?: ReactNode;
  value: string;
}

export default function MultiSelectItem({
  value,
  children,
  badgeLabel,
  onSelect,
  onMouseDown,
  ...props
}: IMultiSelectItemProps) {
  const { toggleValue, selectedValues, setSearchValue, onItemAdded } =
    useMultiSelectContext();
  const isSelected = selectedValues.has(value);

  useEffect(() => {
    onItemAdded(value, badgeLabel ?? children);
  }, [value, children, onItemAdded, badgeLabel]);

  return (
    <CommandItem
      {...props}
      value={value}
      // An item is a div, so pressing on it would move focus off the search
      // input and stop you typing after a pick. Blocking the default keeps the
      // caret in the input; the click still fires and selects.
      onMouseDown={(e) => {
        e.preventDefault();
        onMouseDown?.(e);
      }}
      onSelect={(v) => {
        toggleValue(v);
        if (!isSelected) setSearchValue("");
        onSelect?.(v);
      }}
    >
      <CheckIcon
        aria-hidden="true"
        // text-primary beats CommandItem's [&_svg:not([class*='text-'])] muted rule, so a
        // picked option reads as picked rather than as a grey tick you have to hunt for.
        className={cn(
          "mr-2 size-4 text-primary",
          isSelected ? "opacity-100" : "opacity-0",
        )}
      />
      <span className={cn(isSelected && "font-medium text-primary")}>
        {children}
      </span>
    </CommandItem>
  );
}
