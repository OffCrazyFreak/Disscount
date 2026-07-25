"use client";

import { ReactNode, type RefObject } from "react";

import { Drawer, DrawerContent, DrawerFooter } from "@/components/ui/drawer";
import SheetShellHeader from "@/components/custom/modal/sheet-shell-header";
import { cn } from "@/lib/utils";

/** Under the bottom nav at z-45, so the bar stays visible above every sheet */
const CONTENT_CLASS = "z-[44] max-h-[85dvh] pb-[var(--sheet-bottom-clearance)]";
const OVERLAY_CLASS = "z-[43]";
const BODY_CLASS = "flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4";

export interface ISheetShellProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: string;
  /** Hides the visible title, for sheets whose content already names itself */
  srOnlyTitle?: boolean;
  srOnlyDescription?: boolean;
  /** Sits opposite the title, e.g. a clear-filters button */
  headerExtra?: ReactNode;
  footer?: ReactNode;
  /** Focused on open, so the user can start typing straight away */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** Off drops the scrim and the scroll lock, leaving the page usable behind */
  modal?: boolean;
  bodyClassName?: string;
  className?: string;
  children?: ReactNode;
}

/**
 * ModalShell's bottom-sheet counterpart: a vaul drawer with the grab handle, so
 * every sheet in the app can be swiped closed the same way and only the content
 * differs.
 *
 * The geometry is the shell's business, not the caller's. Height, layer and the
 * inset that keeps the sheet clear of the mobile bar are all fixed here, which is
 * what stops four sheets from drifting into four different shapes again.
 */
export default function SheetShell({
  open,
  onOpenChange,
  title,
  description,
  srOnlyTitle = false,
  srOnlyDescription = true,
  headerExtra,
  footer,
  initialFocusRef,
  modal = true,
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
        className={cn(CONTENT_CLASS, className)}
        overlayClassName={OVERLAY_CLASS}
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
        // No trigger to restore focus to, and Radix's body fallback jumps the scroll.
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        <SheetShellHeader
          title={title}
          description={description}
          srOnlyTitle={srOnlyTitle}
          srOnlyDescription={srOnlyDescription}
          headerExtra={headerExtra}
        />

        {children && (
          <div className={cn(BODY_CLASS, bodyClassName)}>{children}</div>
        )}

        {footer && (
          <DrawerFooter className="px-4 pt-3 pb-0">{footer}</DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
}
