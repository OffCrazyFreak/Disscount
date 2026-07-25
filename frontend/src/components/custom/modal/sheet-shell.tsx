"use client";

import { ReactNode, type RefObject } from "react";

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

export interface ISheetShellProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: string;
  srOnlyDescription?: boolean;
  /** Sits opposite the title, e.g. a clear-filters button */
  headerExtra?: ReactNode;
  footer?: ReactNode;
  /** Focused on open, so the user can start typing straight away */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** Off drops the scrim and the scroll lock, leaving the page usable behind */
  modal?: boolean;
  /** Hides the visible title, for sheets whose content already names itself */
  srOnlyTitle?: boolean;
  bodyClassName?: string;
  className?: string;
  children?: ReactNode;
}

/**
 * ModalShell's bottom-sheet counterpart: a vaul drawer with the grab handle, so
 * every sheet in the app can be swiped closed the same way and only the content
 * differs.
 */
export default function SheetShell({
  open,
  onOpenChange,
  title,
  description,
  srOnlyDescription = true,
  headerExtra,
  footer,
  initialFocusRef,
  modal = true,
  srOnlyTitle = false,
  bodyClassName,
  className,
  children,
}: ISheetShellProps) {
  return (
    <Drawer
      direction="bottom"
      open={open}
      onOpenChange={onOpenChange}
      modal={modal}
    >
      <DrawerContent
        className={cn("max-h-[85dvh]", className)}
        // Radix's documented opt-out for a sheet with no description.
        {...(description ? {} : { "aria-describedby": undefined })}
        // Focus the named field, or the container: focusing the first control
        // instead would pop its tooltip.
        onOpenAutoFocus={(event) => {
          event.preventDefault();

          const target = initialFocusRef?.current ?? event.currentTarget;
          if (target instanceof HTMLElement)
            target.focus({ preventScroll: true });
        }}
      >
        <div
          className={cn(
            "flex items-center justify-between gap-2 px-4 pt-2 pb-3",
            srOnlyTitle && !headerExtra && "sr-only",
          )}
        >
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

          {headerExtra}
        </div>

        {children && (
          <div
            className={cn(
              "flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-2",
              bodyClassName,
            )}
          >
            {children}
          </div>
        )}

        {footer && (
          <DrawerFooter className="px-4 pt-3 pb-4">{footer}</DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
}
