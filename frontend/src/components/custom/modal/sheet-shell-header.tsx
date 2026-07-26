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
  /** An explicit way out, for a sheet whose own content offers none */
  showCloseButton?: boolean;
}

/**
 * The band between the grab handle and the body.
 *
 * Its padding is unconditional, and that is the whole point: `sr-only` takes the
 * title out of flow, so a sheet that names itself in its content still keeps the
 * gap that separates the handle from the first control.
 *
 * The top inset is an explicit 1rem rather than `pt-4`, which this project's
 * 0.2rem spacing scale would render as 12.8px, leaving the handle closer to the
 * title than to the sheet's own edge.
 */
export default function SheetShellHeader({
  title,
  description,
  srOnlyTitle = false,
  srOnlyDescription = true,
  showCloseButton = false,
}: ISheetShellHeaderProps) {
  return (
    <div className="flex shrink-0 items-start justify-between gap-2 px-4 pt-[1rem] pb-2">
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

      {showCloseButton && (
        <DrawerClose asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Zatvori"
            className="shrink-0 text-muted-foreground"
          >
            <X className="size-4" />
          </Button>
        </DrawerClose>
      )}
    </div>
  );
}
