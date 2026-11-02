"use client";

import { ReactNode, useRef, type RefObject } from "react";

import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerVirtualKeyboardProvider,
} from "@/components/ui/drawer";
import SheetShellHeader, {
  type ISheetShellHeaderProps,
} from "@/components/custom/modal/sheet-shell-header";
import useSheetDragUp from "@/components/custom/modal/use-sheet-drag-up";
import ScrollFadeArea from "@/components/custom/common/scroll-fade-area";
import { cn } from "@/lib/utils";

// The grab handle: darker than shadcn's bg-muted, which all but vanished on a
// light surface. Applied from here rather than by editing the primitive.
const HANDLE_CLASS = "[&>[data-slot=drawer-handle]]:bg-muted-foreground/40";

/**
 * Under the bottom nav, so the bar stays visible above every sheet, and wearing
 * the bar's blur so the two read as one family of floating chrome.
 *
 * Far less translucent than the bar, though: a sheet is full of white inputs, and
 * at the bar's own 50% the page ghosts through hard enough that every field looks
 * like it is floating in front of the sheet rather than sitting in it.
 */
const CONTENT_CLASS =
  "max-h-[85dvh] bg-background/85 backdrop-blur-xs pb-[var(--sheet-bottom-clearance)]";
// A sheet opened from inside another drawer, such as the install sheet in the
// mobile sidebar, has to clear that drawer's layer rather than sit under it.
const VIEWPORT_CLASS =
  "z-[var(--z-bottom-sheet)] data-nested:z-[var(--z-overlay)]";
// A nested sheet's scrim follows its sheet up, so it also covers the drawer below.
const OVERLAY_CLASS =
  "z-[var(--z-bottom-sheet-scrim)] has-[+[data-nested]]:z-[var(--z-overlay)]";
const BODY_CLASS = "flex flex-1 flex-col gap-3 px-4";

export interface ISheetShellProps extends ISheetShellHeaderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Hides the visible title, for sheets whose content already names itself */
  srOnlyTitle?: boolean;
  /** Pinned below the body, so it survives the body scrolling */
  footer?: ReactNode;
  /** Dragging the sheet upward, which the drawer itself never acts on */
  onDragUp?: () => void;
  /** Focused on open, so the user can start typing straight away */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /**
   * Focused on close, for a sheet whose opener is not the element focused when
   * it opened. Without it focus returns to whatever was focused before.
   */
  returnFocusRef?: RefObject<HTMLElement | null>;
  /**
   * On it adds the scrim, the scroll lock and the focus trap, and lets an outside
   * press dismiss; off, the page behind stays usable and only the handle, Escape
   * and an explicit control can. Defaults on, because only a
   * sheet the page changes behind earns the opt-out, and forgetting the prop
   * should cost a scrim rather than tap-outside-to-close.
   */
  modal?: boolean;
  bodyClassName?: string;
  className?: string;
  children?: ReactNode;
}

/**
 * ModalShell's bottom-sheet counterpart: a Base UI drawer with the grab handle, so
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
  footer,
  onDragUp,
  initialFocusRef,
  returnFocusRef,
  modal = true,
  bodyClassName,
  className,
  children,
  ...header
}: ISheetShellProps) {
  const dragUpProps = useSheetDragUp(onDragUp);
  const popupRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      modal={modal}
      // Non-modal means the page behind is in use: a press or focus out there
      // must not close the sheet, so it needs its own way out.
      disablePointerDismissal={!modal}
    >
      {/* Keeps a focused field in view above a phone's software keyboard. */}
      <DrawerVirtualKeyboardProvider>
        <DrawerContent
          ref={popupRef}
          className={cn(CONTENT_CLASS, HANDLE_CLASS, className)}
          overlayClassName={OVERLAY_CLASS}
          viewportClassName={VIEWPORT_CLASS}
          // Focus the named field, or the sheet itself: focusing the first control
          // instead would pop its tooltip.
          // preventScroll by hand: Base UI only passes it when focusing the popup.
          initialFocus={() => {
            const opener = document.activeElement;
            openerRef.current =
              opener instanceof HTMLElement &&
              opener !== document.body &&
              !popupRef.current?.contains(opener)
                ? opener
                : null;

            const field = initialFocusRef?.current;
            if (!field) return popupRef.current;

            field.focus({ preventScroll: true });

            return false;
          }}
          // Only reclaim focus the sheet still holds. A press that closed a
          // non-modal sheet has already put focus where the user wanted it, and
          // pulling it back would drop the phone keyboard off a field.
          finalFocus={() => {
            const active = document.activeElement;
            const isFocusLeftBehind =
              !active ||
              active === document.body ||
              !!popupRef.current?.contains(active);

            if (!isFocusLeftBehind) return false;

            // Nothing was focused when it opened (a tap on iOS, a shared link),
            // so there is nothing to go back to.
            return returnFocusRef?.current ?? openerRef.current ?? false;
          }}
          {...dragUpProps}
        >
          <SheetShellHeader {...header} />

          {/* The fades end at the body's own bottom, so they stop above the footer
            and the nav clearance. */}
          {children && (
            <ScrollFadeArea
              className={cn(BODY_CLASS, bodyClassName)}
              wrapperClassName="flex-1"
              fadeClassName="from-background/85 h-12"
            >
              {children}
            </ScrollFadeArea>
          )}

          {footer && (
            <DrawerFooter className="px-4 pt-3 pb-0">{footer}</DrawerFooter>
          )}
        </DrawerContent>
      </DrawerVirtualKeyboardProvider>
    </Drawer>
  );
}
