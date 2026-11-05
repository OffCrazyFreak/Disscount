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

// Darker than shadcn's bg-muted, which all but vanished on a light surface.
const HANDLE_CLASS = "[&>[data-slot=drawer-handle]]:bg-muted-foreground/40";

/** Less translucent than the bar, because at 50% every white field looks like it floats off the sheet. */
const CONTENT_CLASS =
  "max-h-[85dvh] bg-background/85 backdrop-blur-xs pb-[var(--sheet-bottom-clearance)]";
// A sheet opened from inside another drawer has to clear that drawer's layer rather than sit under it.
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
  /** For an opener that is not the focused element, or focus returns to whatever held it before. */
  returnFocusRef?: RefObject<HTMLElement | null>;
  /** Defaults on, so forgetting the prop costs a scrim, not tap-outside-to-close. */
  modal?: boolean;
  bodyClassName?: string;
  className?: string;
  children?: ReactNode;
}

/** Geometry is fixed here, not by the caller, so sheets cannot drift into different shapes. */
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
      // Non-modal means the page behind is in use, so a press or focus there must not close the sheet.
      disablePointerDismissal={!modal}
    >
      {/* Keeps a focused field in view above a phone's software keyboard. */}
      <DrawerVirtualKeyboardProvider>
        <DrawerContent
          ref={popupRef}
          className={cn(CONTENT_CLASS, HANDLE_CLASS, className)}
          overlayClassName={OVERLAY_CLASS}
          viewportClassName={VIEWPORT_CLASS}
          // The first control would pop its tooltip; preventScroll by hand, as Base UI skips it here.
          initialFocus={() => {
            // Reopened mid-exit, focus is still inside: keep the first opener.
            const opener = document.activeElement;
            if (!popupRef.current?.contains(opener)) {
              openerRef.current =
                opener instanceof HTMLElement && opener !== document.body
                  ? opener
                  : null;
            }

            const field = initialFocusRef?.current;
            if (!field) return popupRef.current;

            field.focus({ preventScroll: true });

            return false;
          }}
          // Only focus the sheet still holds, or a closing press would drop the phone keyboard off a field.
          finalFocus={() => {
            const active = document.activeElement;
            const isFocusLeftBehind =
              !active ||
              active === document.body ||
              !!popupRef.current?.contains(active);

            if (!isFocusLeftBehind) return false;

            // Nothing was focused on open (iOS tap, shared link); Base UI checks isConnected only on its fallbacks.
            const opener = openerRef.current?.isConnected
              ? openerRef.current
              : null;

            return returnFocusRef?.current ?? opener ?? false;
          }}
          {...dragUpProps}
        >
          <SheetShellHeader {...header} />

          {/* The fades end at the body's own bottom, so they stop above the footer and the nav clearance. */}
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
