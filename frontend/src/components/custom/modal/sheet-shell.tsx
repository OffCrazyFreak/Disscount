"use client";

import { ReactNode, type RefObject } from "react";

import { Drawer, DrawerContent, DrawerFooter } from "@/components/ui/drawer";
import SheetShellHeader from "@/components/custom/modal/sheet-shell-header";
import useSheetDragUp from "@/components/custom/modal/use-sheet-drag-up";
import { cn } from "@/lib/utils";

/**
 * Under the bottom nav, so the bar stays visible above every sheet, and wearing
 * the bar's blur so the two read as one family of floating chrome.
 *
 * Far less translucent than the bar, though: a sheet is full of white inputs, and
 * at the bar's own 50% the page ghosts through hard enough that every field looks
 * like it is floating in front of the sheet rather than sitting in it.
 */
// The cap carries vaul's own direction variant, or drawer.tsx's 80vh outranks a
// plain max-h and the sheet silently keeps a static cap that ignores the keyboard.
const CONTENT_CLASS =
  "z-[var(--z-bottom-sheet)] data-[vaul-drawer-direction=bottom]:max-h-[85dvh] bg-background/85 backdrop-blur-sm pb-[var(--sheet-bottom-clearance)]";
const OVERLAY_CLASS = "z-[var(--z-bottom-sheet-scrim)]";
const BODY_CLASS = "flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4";

export interface ISheetShellProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: string;
  /** Hides the visible title, for sheets whose content already names itself */
  srOnlyTitle?: boolean;
  srOnlyDescription?: boolean;
  /** Pinned below the body, so it survives the body scrolling */
  footer?: ReactNode;
  /** An explicit way out, for a sheet whose own content offers none */
  showCloseButton?: boolean;
  /** Dragging the sheet upward, which vaul otherwise clamps to nothing */
  onDragUp?: () => void;
  /** Focused on open, so the user can start typing straight away */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /**
   * On it adds the scrim and the scroll lock, and lets an outside press dismiss;
   * off, only the handle and an explicit control can. Defaults on, because only a
   * sheet the page changes behind earns the opt-out, and forgetting the prop
   * should cost a scrim rather than tap-outside-to-close.
   */
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
  footer,
  showCloseButton = false,
  onDragUp,
  initialFocusRef,
  modal = true,
  bodyClassName,
  className,
  children,
}: ISheetShellProps) {
  const dragUpProps = useSheetDragUp(onDragUp);

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
        // Radix locks the body whatever vaul is told, so globals.css hands the
        // page back off this marker. Absent when modal, which wants the lock.
        {...(modal ? {} : { "data-sheet-non-modal": "" })}
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
        {...dragUpProps}
      >
        <SheetShellHeader
          title={title}
          description={description}
          srOnlyTitle={srOnlyTitle}
          srOnlyDescription={srOnlyDescription}
          showCloseButton={showCloseButton}
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
