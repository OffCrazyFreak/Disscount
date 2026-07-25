"use client";

import { ReactNode } from "react";
import { X } from "lucide-react";

import {
  DrawerClose,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ISheetShellHeaderProps {
  title: ReactNode;
  description?: string;
  srOnlyTitle?: boolean;
  srOnlyDescription?: boolean;
  /** Sits opposite the title, e.g. a clear-filters button */
  headerExtra?: ReactNode;
  /** For a sheet with no other explicit way out, since no sheet closes on an outside tap */
  showCloseButton?: boolean;
}

/**
 * The band between the grab handle and the body.
 *
 * Its padding is unconditional, and that is the whole point: `sr-only` takes the
 * title out of flow, so a sheet that names itself in its content still keeps the
 * gap that separates the handle from the first control.
 */
export default function SheetShellHeader({
  title,
  description,
  srOnlyTitle = false,
  srOnlyDescription = true,
  headerExtra,
  showCloseButton = false,
}: ISheetShellHeaderProps) {
  return (
    <div className="flex shrink-0 items-start justify-between gap-2 px-4 pt-3 pb-2">
      <div
        className={cn("flex min-w-0 flex-col gap-1", srOnlyTitle && "sr-only")}
      >
        <DrawerTitle className="truncate text-lg">{title}</DrawerTitle>

        {description && (
          <DrawerDescription className={cn(srOnlyDescription && "sr-only")}>
            {description}
          </DrawerDescription>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {headerExtra}

        {showCloseButton && (
          <DrawerClose asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Zatvori"
              className="text-muted-foreground"
            >
              <X className="size-4" />
            </Button>
          </DrawerClose>
        )}
      </div>
    </div>
  );
}
