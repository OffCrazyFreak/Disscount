"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

interface IBottomSheetHeaderProps {
  title: ReactNode;
  description?: string;
  srOnlyTitle?: boolean;
  srOnlyDescription?: boolean;
  onClose?: () => void;
}

/**
 * The row's own padding is the grab handle's clearance, so `sr-only` may only
 * ever mark the text: an absolutely positioned row contributes no height.
 */
export default function BottomSheetHeader({
  title,
  description,
  srOnlyTitle = false,
  srOnlyDescription = true,
  onClose,
}: IBottomSheetHeaderProps) {
  return (
    <div className="flex shrink-0 items-start justify-between gap-2 px-4 pt-3 pb-2">
      <div className="flex min-w-0 flex-col gap-1">
        <DrawerTitle
          className={cn("truncate text-lg", srOnlyTitle && "sr-only")}
        >
          {title}
        </DrawerTitle>

        {description && (
          <DrawerDescription className={cn(srOnlyDescription && "sr-only")}>
            {description}
          </DrawerDescription>
        )}
      </div>

      {onClose && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Zatvori"
          className="shrink-0"
          onClick={onClose}
        >
          <X className="size-5" />
        </Button>
      )}
    </div>
  );
}
