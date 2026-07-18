"use client";

import { ReactNode } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ModalShellFooter,
  ModalShellFooterProps,
} from "@/components/ui/modal-shell-footer";
import { UnsavedIndicator } from "@/components/ui/unsaved-indicator";
import { cn } from "@/lib/utils";

// TODO(responsive-drawer): add a `presentation?: "dialog" | "auto"` prop that renders
// a vaul Drawer below the md breakpoint instead of a centered dialog.

const SIZE_CLASSES = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-4xl",
} as const;

export interface ModalShellProps extends ModalShellFooterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: string;
  srOnlyDescription?: boolean;
  size?: keyof typeof SIZE_CLASSES;
  // Blocks ESC, overlay clicks and the X while a critical action is running.
  preventClose?: boolean;
  // Rendered above the title (e.g. a confirm dialog's icon badge).
  hero?: ReactNode;
  centered?: boolean;
  // Shows the amber "unsaved changes" marker next to the title.
  dirty?: boolean;
  headerExtra?: ReactNode;
  // Replaces the composed footer entirely when the slot props don't fit.
  footer?: ReactNode;
  bodyClassName?: string;
  children?: ReactNode;
}

export function ModalShell({
  open,
  onOpenChange,
  title,
  description,
  srOnlyDescription = false,
  size = "md",
  preventClose = false,
  hero,
  centered = false,
  dirty = false,
  headerExtra,
  footer,
  bodyClassName,
  children,
  ...footerProps
}: ModalShellProps) {
  function handleOpenChange(nextOpen: boolean) {
    if (preventClose && !nextOpen) return;
    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          "flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0",
          SIZE_CLASSES[size]
        )}
        showCloseButton={!preventClose}
        // Radix warns when a dialog has no description; explicitly passing
        // undefined is its documented opt-out for description-less dialogs.
        {...(description ? {} : { "aria-describedby": undefined })}
        onEscapeKeyDown={(e) => preventClose && e.preventDefault()}
        onInteractOutside={(e) => preventClose && e.preventDefault()}
        // Don't auto-focus the first control on open: it would pop that
        // control's tooltip immediately. Inputs with autoFocus still focus
        // themselves via the DOM.
        onOpenAutoFocus={(e) => e.preventDefault()}
        // URL-mounted dialogs have no trigger element to return focus to; letting
        // Radix fall back to document.body causes a scroll jump on close.
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader
          className={cn(
            "gap-1.5 px-6 pt-6",
            centered && "items-center text-center sm:text-center"
          )}
        >
          {hero}
          <DialogTitle className="flex items-center gap-2 text-xl">
            {title}
            {dirty && <UnsavedIndicator />}
          </DialogTitle>
          {description && (
            <DialogDescription className={cn(srOnlyDescription && "sr-only")}>
              {description}
            </DialogDescription>
          )}
          {headerExtra}
        </DialogHeader>

        {children && (
          <div className={cn("min-h-0 overflow-y-auto px-6 py-4", bodyClassName)}>
            {children}
          </div>
        )}

        {footer ?? (
          <ModalShellFooter
            onCancel={() => handleOpenChange(false)}
            {...footerProps}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
