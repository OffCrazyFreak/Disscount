"use client";

import { useId } from "react";
import type { LucideIcon } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface ICopyOptionRowProps {
  icon: LucideIcon;
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
}

/** Not SettingRow, which renders its label as a paragraph: a checkbox needs a real label for its name and a full-row hit target. */
export default function CopyOptionRow({
  icon: Icon,
  label,
  description,
  checked,
  disabled = false,
  onCheckedChange,
}: ICopyOptionRowProps) {
  const id = useId();
  const descriptionId = `${id}-description`;

  return (
    <div className={cn("flex items-center gap-3", disabled && "opacity-50")}>
      <span
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-full",
          checked
            ? "bg-primary/10 text-primary"
            : "bg-muted text-muted-foreground",
        )}
      >
        {/* size-6 matches the share modal, bottom nav and card visibility indicator, so the same icons read at one size. */}
        <Icon aria-hidden="true" className="size-6" />
      </span>

      {/* Outside the label, because wrapping both would name the checkbox with the description and aria-describedby would then repeat it. */}
      <div className="min-w-0 flex-1 space-y-0.5">
        <label
          htmlFor={id}
          className="block cursor-pointer text-sm font-medium"
        >
          {label}
        </label>
        <span
          id={descriptionId}
          className="block text-xs text-muted-foreground"
        >
          {description}
        </span>
      </div>

      {/* aria-disabled, because a natively disabled control leaves the tab order and takes its explaining description with it. */}
      <Checkbox
        id={id}
        checked={checked}
        aria-disabled={disabled}
        onCheckedChange={
          disabled ? undefined : (next) => onCheckedChange(next === true)
        }
        aria-describedby={descriptionId}
        // A step below the list items' size-10, because these are settings on a form row, not the screen's primary target.
        className="size-8 shrink-0 [&_svg]:size-6"
      />
    </div>
  );
}
