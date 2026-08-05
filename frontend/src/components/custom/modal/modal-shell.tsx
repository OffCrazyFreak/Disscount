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
  hasFooterContent,
  IModalShellFooterProps,
} from "@/components/custom/modal/modal-shell-footer";
import { handleModalEnterSubmit } from "@/components/custom/modal/modal-enter-submit";
import { UnsavedIndicator } from "@/components/custom/modal/unsaved-indicator";
import { StaggerChildren } from "@/components/custom/animation/stagger-children";
import { cn } from "@/lib/utils";

// TODO(responsive-drawer): a `presentation` prop rendering a vaul Drawer below md.

const SIZE_CLASSES = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-4xl",
} as const;

export interface IModalShellProps extends IModalShellFooterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
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
}: IModalShellProps) {
  function handleOpenChange(nextOpen: boolean) {
    if (preventClose && !nextOpen) return;
    onOpenChange(nextOpen);
  }

  const footerNode =
    footer ??
    (hasFooterContent(footerProps) ? (
      <ModalShellFooter
        onCancel={() => handleOpenChange(false)}
        {...footerProps}
      />
    ) : null);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          // dvh, not vh: vh is the large viewport, so with a mobile URL bar
          // showing, the box extends past the visible area and the footer goes
          // with it.
          "flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-0",
          // Overshoot easing on open only; the close keeps the default ease.
          "data-[state=open]:duration-300 data-[state=open]:ease-[cubic-bezier(0.34,1.5,0.64,1)]",
          SIZE_CLASSES[size],
        )}
        showCloseButton={!preventClose}
        // Radix's documented opt-out for a dialog with no description.
        {...(description ? {} : { "aria-describedby": undefined })}
        onEscapeKeyDown={(e) => preventClose && e.preventDefault()}
        onInteractOutside={(e) => preventClose && e.preventDefault()}
        onKeyDown={(event) =>
          handleModalEnterSubmit(event, {
            formId: footerProps.formId,
            onSubmit: footerProps.onSubmit,
            disabled: footerProps.submitDisabled || footerProps.submitLoading,
          })
        }
        // Focus the container, not the first control, which would pop its tooltip.
        // Inputs with autoFocus still focus themselves via the DOM.
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          (e.currentTarget as HTMLElement | null)?.focus();
        }}
        // No trigger to restore focus to, and Radix's body fallback jumps the scroll.
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader
          className={cn(
            "gap-1.5 px-6 pt-6",
            // With a body, the body is the only flexible track, so a long list
            // or a large font size scrolls instead of squeezing the title and
            // the buttons out of shape.
            //
            // Without one (confirm, donation, auth-status) there is no such
            // track, and pinning both header and footer inside overflow-hidden
            // would clip the buttons away with nothing to scroll. So the header
            // takes that role instead and the footer stays reachable.
            children ? "shrink-0" : "min-h-0 flex-1 overflow-y-auto",
            centered ? "items-center text-center sm:text-center" : "text-left",
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
          <div
            className={cn(
              "min-h-0 flex-1 overflow-y-auto px-6 py-4",
              bodyClassName,
            )}
          >
            {/* Centralized reveal: the body cascades in on every open (Radix
                remounts the content), so modals don't animate themselves. */}
            <StaggerChildren>{children}</StaggerChildren>
          </div>
        )}

        {/* Wraps the slot rather than the composed footer, so a caller passing
            its own footer node is held to the same contract. Rendered only when
            there is something to wrap, because ModalShellFooter returns null
            with no buttons and an empty flex child would still take a gap.
            The safe-area padding is for the shortest viewports, where 90dvh
            leaves less below the dialog than the home indicator needs. */}
        {footerNode && (
          <div className="shrink-0 pb-[env(safe-area-inset-bottom)]">
            {footerNode}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
