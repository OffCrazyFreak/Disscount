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

      <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer space-y-0.5">
        <span className="block text-sm font-medium">{label}</span>
        <span
          id={descriptionId}
          className="block text-xs text-muted-foreground"
        >
          {description}
        </span>
      </label>

      <Checkbox
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={(next) => onCheckedChange(next === true)}
        aria-describedby={descriptionId}
        className="size-6 shrink-0 [&_svg]:size-4"
      />
    </div>
  );
}
