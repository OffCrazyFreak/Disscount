"use client";

import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Full width and stacked, left-aligned so the labels read as a list */
const ACTION_CLASS = "w-full justify-start gap-3";

interface IQuickActionItemProps {
  icon: LucideIcon;
  label: string;
  onSelect: () => void;
  variant?: "primary" | "destructive";
  disabled?: boolean;
  loading?: boolean;
}

/** One row in a quick-actions sheet, so every sheet's rows read identically. */
export default function QuickActionItem({
  icon: Icon,
  label,
  onSelect,
  variant = "primary",
  disabled = false,
  loading = false,
}: IQuickActionItemProps) {
  return (
    <Button
      type="button"
      variant={variant}
      onClick={onSelect}
      disabled={disabled || loading}
      loading={loading}
      loadingIconPlacement="left"
      className={cn(ACTION_CLASS)}
    >
      <Icon aria-hidden="true" className="size-5" />
      {label}
    </Button>
  );
}
