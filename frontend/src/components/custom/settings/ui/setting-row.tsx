"use client";

import { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface SettingRowProps {
  label: ReactNode;
  description?: ReactNode;
  control: ReactNode;
  destructive?: boolean;
  className?: string;
}

// A flat two-column row: label + description on the left, a control on the
// right. Group several under `divide-y` for the "occasional divider" look.
export function SettingRow({
  label,
  description,
  control,
  destructive = false,
  className,
}: SettingRowProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-6 py-4 first:pt-0 last:pb-0",
        className
      )}
    >
      <div className="space-y-1">
        <p
          className={cn(
            "text-sm font-medium",
            destructive && "text-destructive"
          )}
        >
          {label}
        </p>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>

      <div className="shrink-0">{control}</div>
    </div>
  );
}
