"use client";

import * as React from "react";
import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer";

import { cn } from "@/lib/utils";

type SwipeDirection = NonNullable<DrawerPrimitive.Root.Props["swipeDirection"]>;

interface IDrawerContext {
  modal: DrawerPrimitive.Root.Props["modal"];
  swipeDirection: SwipeDirection;
  popupRef: React.RefObject<HTMLDivElement | null>;
}

const DrawerContext = React.createContext<IDrawerContext>({
  modal: true,
  swipeDirection: "down",
  popupRef: { current: null },
});

// Positioned with `transform`, not Tailwind's `translate-*`: Base UI writes an
// inline transform while swiping, which replaces this one, whereas the separate
// `translate` property would stack with it and move the sheet twice as far.
const POPUP_DIRECTION_CLASS: Record<SwipeDirection, string> = {
  down: "inset-x-0 bottom-0 [--drawer-max-h:80vh] rounded-t-lg border-t [transform:translateY(var(--drawer-swipe-movement-y,0px))] data-starting-style:[transform:translateY(calc(100%+2px))] data-ending-style:[transform:translateY(calc(100%+2px))]",
  up: "inset-x-0 top-0 [--drawer-max-h:80vh] rounded-b-lg border-b [transform:translateY(var(--drawer-swipe-movement-y,0px))] data-starting-style:[transform:translateY(calc(-100%-2px))] data-ending-style:[transform:translateY(calc(-100%-2px))]",
  left: "inset-y-0 left-0 w-3/4 border-r sm:max-w-sm [transform:translateX(var(--drawer-swipe-movement-x,0px))] data-starting-style:[transform:translateX(calc(-100%-2px))] data-ending-style:[transform:translateX(calc(-100%-2px))]",
  right:
    "inset-y-0 right-0 w-3/4 border-l sm:max-w-sm [transform:translateX(var(--drawer-swipe-movement-x,0px))] data-starting-style:[transform:translateX(calc(100%+2px))] data-ending-style:[transform:translateX(calc(100%+2px))]",
};

const HANDLE_DIRECTION_CLASS: Record<SwipeDirection, string> = {
  down: "mx-auto mt-4 h-2 w-[100px]",
  up: "order-last mx-auto mb-4 h-2 w-[100px]",
  left: "absolute top-1/2 right-2 h-[100px] w-2 -translate-y-1/2",
  right: "absolute top-1/2 left-2 h-[100px] w-2 -translate-y-1/2",
};

function Drawer({
  modal = true,
  swipeDirection = "down",
  onOpenChange,
  ...props
}: DrawerPrimitive.Root.Props) {
  const popupRef = React.useRef<HTMLDivElement | null>(null);

  return (
    <DrawerContext.Provider value={{ modal, swipeDirection, popupRef }}>
      <DrawerPrimitive.Root
        data-slot="drawer"
        modal={modal}
        swipeDirection={swipeDirection}
        onOpenChange={(open, details) => {
          const target = details.event.target;

          // Radix layers keep their own Escape stack, which this drawer is not
          // on, so a Radix dialog, menu or tooltip over it would close with it.
          // Radix marks the Escape it consumed with preventDefault.
          const isEscapeForAnotherLayer =
            details.reason === "escape-key" &&
            (details.event.defaultPrevented ||
              (target instanceof Node &&
                target !== document.body &&
                !popupRef.current?.contains(target)));

          // A modal Radix menu sets pointer-events: none on the body, which the
          // backdrop inherits, so the tap meant to close the menu hits <html>.
          const isPressForAnotherLayer =
            details.reason === "outside-press" &&
            target === document.documentElement;

          if (!open && (isEscapeForAnotherLayer || isPressForAnotherLayer)) {
            details.cancel();
            return;
          }

          onOpenChange?.(open, details);
        }}
        {...props}
      />
    </DrawerContext.Provider>
  );
}

function DrawerTrigger({ ...props }: DrawerPrimitive.Trigger.Props) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
}

function DrawerVirtualKeyboardProvider({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.VirtualKeyboardProvider>) {
  return <DrawerPrimitive.VirtualKeyboardProvider {...props} />;
}

function DrawerPortal({ ...props }: DrawerPrimitive.Portal.Props) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />;
}

function DrawerClose({ ...props }: DrawerPrimitive.Close.Props) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />;
}

function DrawerOverlay({
  className,
  ...props
}: DrawerPrimitive.Backdrop.Props) {
  return (
    <DrawerPrimitive.Backdrop
      data-slot="drawer-overlay"
      className={cn(
        "fixed inset-0 z-50 min-h-dvh bg-black/50 opacity-[calc(1-var(--drawer-swipe-progress,0))] transition-opacity duration-450 ease-[cubic-bezier(0.32,0.72,0,1)] data-starting-style:opacity-0 data-ending-style:opacity-0 data-swiping:duration-0 motion-reduce:transition-none",
        className,
      )}
      {...props}
    />
  );
}

interface IDrawerContentProps extends DrawerPrimitive.Popup.Props {
  /** Restyles the scrim, which the content renders and so nothing else can reach */
  overlayClassName?: string;
  /** Sets the layer: the viewport is fixed, so it is the stacking context */
  viewportClassName?: string;
}

function DrawerContent({
  className,
  overlayClassName,
  viewportClassName,
  children,
  ref,
  ...props
}: IDrawerContentProps) {
  const { modal, swipeDirection, popupRef } = React.useContext(DrawerContext);

  // Compose the caller's ref with the root's, so {...props} cannot drop either.
  function setPopupRef(node: HTMLDivElement | null) {
    popupRef.current = node;

    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  }

  // DEVIATION from upstream shadcn, deliberately kept: overlayClassName and
  // viewportClassName, since both elements are rendered here and a caller
  // cannot reach them otherwise. Re-apply them after any `shadcn add drawer`.
  return (
    <DrawerPortal>
      {/* forceRender: Base UI skips a nested drawer's backdrop, which left a
          modal sheet opened from the sidebar with no scrim to close it. */}
      {modal === true && (
        <DrawerOverlay forceRender className={overlayClassName} />
      )}
      <DrawerPrimitive.Viewport
        data-slot="drawer-viewport"
        data-modal={String(modal)}
        className={cn(
          "pointer-events-none fixed inset-0 z-50",
          viewportClassName,
        )}
      >
        <DrawerPrimitive.Popup
          ref={setPopupRef}
          data-slot="drawer-popup"
          className={cn(
            "group/drawer-popup pointer-events-auto fixed flex max-h-(--drawer-max-h,none) min-h-0 flex-col bg-background outline-none transition-transform duration-450 ease-[cubic-bezier(0.32,0.72,0,1)] data-swiping:select-none data-swiping:duration-0 data-ending-style:duration-[calc(var(--drawer-swipe-strength,1)*400ms)] motion-reduce:transition-none",
            POPUP_DIRECTION_CLASS[swipeDirection],
            className,
          )}
          {...props}
        >
          <div
            data-slot="drawer-handle"
            aria-hidden="true"
            className={cn(
              "shrink-0 rounded-full bg-muted",
              HANDLE_DIRECTION_CLASS[swipeDirection],
            )}
          />
          <DrawerPrimitive.Content
            data-slot="drawer-content"
            className="flex min-h-0 flex-1 flex-col"
          >
            {children}
          </DrawerPrimitive.Content>
        </DrawerPrimitive.Popup>
      </DrawerPrimitive.Viewport>
    </DrawerPortal>
  );
}

function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-header"
      className={cn(
        "flex flex-col gap-0.5 p-4 md:gap-1.5 md:text-left",
        className,
      )}
      {...props}
    />
  );
}

function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  );
}

function DrawerTitle({ className, ...props }: DrawerPrimitive.Title.Props) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn("font-semibold text-foreground", className)}
      {...props}
    />
  );
}

function DrawerDescription({
  className,
  ...props
}: DrawerPrimitive.Description.Props) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
  DrawerVirtualKeyboardProvider,
};
