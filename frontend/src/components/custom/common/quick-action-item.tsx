"use client";

import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Full width and stacked, left-aligned so the labels read as a list */
const ACTION_CLASS = "w-full justify-start gap-3";

interface IQuickActionItemProps {
  icon: LucideIcon;
  label: string;
  onSelect: () => void;
  variant?: "primary" | "destructive";
}

export default function QuickActionItem({
  icon: Icon,
  label,
  onSelect,
  variant = "primary",
}: IQuickActionItemProps) {
  return (
    <Button
      type="button"
      variant={variant}
      onClick={onSelect}
      className={ACTION_CLASS}
    >
      <Icon aria-hidden="true" className="size-5" />
      {label}
    </Button>
  );
}
