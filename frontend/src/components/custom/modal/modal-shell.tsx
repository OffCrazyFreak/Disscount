"use client";

import { KeyboardEvent, ReactNode } from "react";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  ModalShellFooter,
  hasFooterContent,
  IModalShellFooterProps,
} from "@/components/custom/modal/modal-shell-footer";
import { handleModalEnterSubmit } from "@/components/custom/modal/modal-enter-submit";
import { useModalFocusRestore } from "@/components/custom/modal/use-modal-focus-restore";
import ModalShellHeader, {
  IModalShellHeaderContent,
  splitHeaderProps,
} from "@/components/custom/modal/modal-shell-header";
import { StaggerChildren } from "@/components/custom/animation/stagger-children";
import ScrollFadeArea from "@/components/custom/common/scroll-fade-area";
import { cn } from "@/lib/utils";

// TODO(responsive-drawer): a `presentation` prop rendering a Base UI Drawer below md.

const SIZE_CLASSES = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-4xl",
} as const;

export interface IModalShellProps
  extends IModalShellFooterProps, IModalShellHeaderContent {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  size?: keyof typeof SIZE_CLASSES;
  // Blocks ESC, overlay clicks and the X while a critical action is running.
  preventClose?: boolean;
  // Replaces the composed footer entirely when the slot props don't fit.
  footer?: ReactNode;
  bodyClassName?: string;
  children?: ReactNode;
}

export function ModalShell({
  open,
  onOpenChange,
  size = "md",
  preventClose = false,
  footer,
  bodyClassName,
  children,
  ...contentProps
}: IModalShellProps) {
  const { header, rest: footerProps } = splitHeaderProps(contentProps);
  const focusRestore = useModalFocusRestore();

  function handleOpenChange(nextOpen: boolean) {
    if (preventClose && !nextOpen) return;
    onOpenChange(nextOpen);
  }

  function blockWhileLocked(event: Event) {
    if (preventClose) event.preventDefault();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    handleModalEnterSubmit(event, {
      formId: footerProps.formId,
      onSubmit: footerProps.onSubmit,
      disabled: footerProps.submitDisabled || footerProps.submitLoading,
    });
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
          // dvh, because vh is the large viewport, so with a mobile URL bar showing the footer goes past the visible area.
          "flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-0",
          // Overshoot easing on open only; the close keeps the default ease.
          "data-[state=open]:duration-300 data-[state=open]:ease-[cubic-bezier(0.34,1.5,0.64,1)]",
          SIZE_CLASSES[size],
        )}
        showCloseButton={!preventClose}
        // Radix's documented opt-out for a dialog with no description.
        {...(header.description ? {} : { "aria-describedby": undefined })}
        onEscapeKeyDown={blockWhileLocked}
        onInteractOutside={blockWhileLocked}
        onKeyDown={handleKeyDown}
        onOpenAutoFocus={focusRestore.onOpenAutoFocus}
        onCloseAutoFocus={focusRestore.onCloseAutoFocus}
      >
        <ModalShellHeader {...header} hasBody={Boolean(children)} />

        {children && (
          <ScrollFadeArea
            className={cn("flex-1 px-6 py-4", bodyClassName)}
            wrapperClassName="flex-1"
            fadeClassName="h-12"
          >
            {/* The body cascades in on every open because Radix remounts the content, so modals do not animate themselves. */}
            <StaggerChildren>{children}</StaggerChildren>
          </ScrollFadeArea>
        )}

        {/* Wraps the slot so custom footers share the contract, only when there is content; no safe-area padding, which pushes a centred dialog's edge toward the home indicator. */}
        {footerNode && <div className="shrink-0">{footerNode}</div>}
      </DialogContent>
    </Dialog>
  );
}
