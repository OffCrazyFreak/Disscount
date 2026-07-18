"use client";

import { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface SettingsSectionProps {
  icon: LucideIcon;
  label: string;
  hint?: string;
  destructive?: boolean;
  children: ReactNode;
}

// The one section pattern shared by every settings tab: an uppercase icon label,
// an optional one-line hint, then flat content sitting on the modal background.
export function SettingsSection({
  icon: Icon,
  label,
  hint,
  destructive = false,
  children,
}: SettingsSectionProps) {
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
