"use client";

import type { ReactNode, RefObject } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerOverlay,
} from "@/components/ui/drawer";
import BottomSheetHeader from "@/components/custom/bottom-sheet/bottom-sheet-header";
import useBottomSheetDragExpand from "@/components/custom/bottom-sheet/use-bottom-sheet-drag-expand";
import { cn } from "@/lib/utils";

const CONTENT_CLASS =
  "z-[var(--z-bottom-sheet)] max-h-[85dvh] bg-background/85 pb-[var(--sheet-bottom-clearance)] backdrop-blur-sm";

const BODY_CLASS = "flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4";

interface IBottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: string;
  srOnlyTitle?: boolean;
  srOnlyDescription?: boolean;
  /** Off drops the scrim and the scroll lock, for a sheet that adds to its page */
  modal?: boolean;
  showCloseButton?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
  onDragUp?: () => void;
  footer?: ReactNode;
  className?: string;
  children?: ReactNode;
}

/** Owns every bottom sheet's geometry, so no call site sets one of its own. */
export default function BottomSheet({
  open,
  onOpenChange,
  title,
  description,
  srOnlyTitle,
  srOnlyDescription,
  modal = true,
  showCloseButton = false,
  initialFocusRef,
  onDragUp,
  footer,
  className,
  children,
}: IBottomSheetProps) {
  const dragProps = useBottomSheetDragExpand(onDragUp);

  return (
    <Drawer open={open} onOpenChange={onOpenChange} modal={modal}>
      <DrawerContent
        data-bottom-sheet={modal ? "modal" : "non-modal"}
        overlay={
          modal ? (
            <DrawerOverlay className="z-[var(--z-bottom-sheet-scrim)]" />
          ) : null
        }
        className={cn(CONTENT_CLASS, className)}
        {...(description ? {} : { "aria-describedby": undefined })}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          const fallback = event.currentTarget as HTMLElement | null;
          (initialFocusRef?.current ?? fallback)?.focus();
        }}
        // No trigger to restore to, and Radix's body fallback jumps the scroll.
        onCloseAutoFocus={(event) => event.preventDefault()}
        {...dragProps}
      >
        <BottomSheetHeader
          title={title}
          description={description}
          srOnlyTitle={srOnlyTitle}
          srOnlyDescription={srOnlyDescription}
          onClose={showCloseButton ? () => onOpenChange(false) : undefined}
        />

        {children && <div className={BODY_CLASS}>{children}</div>}

        {footer && (
          <DrawerFooter className="px-4 pt-3 pb-0">{footer}</DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
}
