"use client";

import { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface ISettingsSectionProps {
  icon: LucideIcon;
  label: string;
  hint?: string;
  destructive?: boolean;
  children: ReactNode;
}

// The one section pattern shared by every settings tab.
export default function SettingsSection({
  icon: Icon,
  label,
  hint,
  destructive = false,
  children,
}: ISettingsSectionProps) {
  return (
    <section className="space-y-2 pb-6">
      <div className="space-y-1">
        <div
          className={cn(
            "flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide",
            destructive ? "text-destructive" : "text-muted-foreground",
          )}
        >
          <Icon className="size-5" />
          {label}
        </div>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>

      {children}
    </section>
  );
}
