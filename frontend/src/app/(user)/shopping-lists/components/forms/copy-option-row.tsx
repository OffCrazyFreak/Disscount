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

/**
 * One choice in the copy modal. Not SettingRow, which renders its label as a paragraph:
 * a checkbox needs a real label element so it has an accessible name and so the whole
 * row, not just the 40px box, is a hit target.
 */
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
        <Icon aria-hidden="true" className="size-5" />
      </span>

      {/* The description sits outside the label on purpose. Accessible-name computation
          walks the whole label subtree, so wrapping both would name the checkbox
          "Proizvodi Prenesi sve proizvode s popisa." and aria-describedby would then
          announce that sentence a second time. */}
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

      {/* aria-disabled rather than disabled, matching the share modal: a natively
          disabled control leaves the tab order, taking the description that explains
          why it is unavailable with it. */}
      <Checkbox
        id={id}
        checked={checked}
        aria-disabled={disabled}
        onCheckedChange={
          disabled ? undefined : (next) => onCheckedChange(next === true)
        }
        aria-describedby={descriptionId}
        className="size-6 shrink-0 [&_svg]:size-4"
      />
    </div>
  );
}
