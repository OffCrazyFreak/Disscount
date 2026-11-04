"use client";

import { ReactNode } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

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

/** `sr-only` takes the title out of flow, so unconditional padding keeps the gap under the handle; 1rem because `pt-4` is 12.8px at this spacing scale. */
export default function SheetShellHeader({
  title,
  description,
  srOnlyTitle = false,
  srOnlyDescription = true,
  showCloseButton = false,
}: ISheetShellHeaderProps) {
  const t = useTranslations("shell");

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
        <DrawerClose
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t("modal.close")}
              className="shrink-0 text-muted-foreground"
            />
          }
        >
          <X aria-hidden="true" />
        </DrawerClose>
      )}
    </div>
  );
}
